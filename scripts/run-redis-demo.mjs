import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const demoDir = path.join(repoRoot, 'examples', 'session-stores', 'redis');
const redisUrl = process.env.SESSION_STORE_REDIS_URL || 'redis://localhost:6379/0';
const nodeDir = path.dirname(process.execPath);
const npmCmd = resolveNpmCommand();

function fail(message) {
  console.error(`\n[run-redis-demo] ${message}\n`);
  process.exit(1);
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    child.on('error', reject);
    child.on('exit', code => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
    });
  });
}

function resolveNpmCommand() {
  if (process.platform !== 'win32') {
    return 'npm';
  }

  const bundledNpm = path.join(nodeDir, 'npm.cmd');
  if (existsSync(bundledNpm)) {
    return bundledNpm;
  }

  return 'npm.cmd';
}

function buildChildEnv() {
  const env = { ...process.env };
  const pathKey = Object.prototype.hasOwnProperty.call(env, 'Path') ? 'Path' : 'PATH';
  const currentPath = env[pathKey] || '';
  const entries = currentPath.split(path.delimiter).filter(Boolean);

  if (!entries.includes(nodeDir)) {
    env[pathKey] = [nodeDir, ...entries].join(path.delimiter);
  }

  if (process.platform === 'win32' && !env.ComSpec) {
    env.ComSpec = path.join(process.env.SystemRoot || 'C:\\WINDOWS', 'System32', 'cmd.exe');
  }

  return env;
}

function applyOpenRouterDefaults(env) {
  const openRouterKey = env.OPENROUTER_API_KEY;
  const baseUrl = env.ANTHROPIC_BASE_URL;
  const usesOpenRouter = Boolean(openRouterKey) || baseUrl === 'https://openrouter.ai/api';

  if (!usesOpenRouter) {
    return;
  }

  env.ANTHROPIC_BASE_URL = 'https://openrouter.ai/api';
  env.ANTHROPIC_AUTH_TOKEN = openRouterKey || env.ANTHROPIC_AUTH_TOKEN || '';
  env.ANTHROPIC_API_KEY = '';

  const openRouterModel = env.OPENROUTER_MODEL || 'openrouter/auto';

  env.OPENROUTER_MODEL = openRouterModel;
  env.ANTHROPIC_DEFAULT_OPUS_MODEL = openRouterModel;
  env.ANTHROPIC_DEFAULT_SONNET_MODEL = openRouterModel;
  env.ANTHROPIC_DEFAULT_HAIKU_MODEL = openRouterModel;
  env.CLAUDE_CODE_SUBAGENT_MODEL = openRouterModel;
}

function resolveTsxCli() {
  const packageJsonPath = path.join(demoDir, 'node_modules', 'tsx', 'package.json');
  if (!existsSync(packageJsonPath)) {
    return null;
  }

  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const binEntry =
    typeof pkg.bin === 'string'
      ? pkg.bin
      : pkg.bin?.tsx;

  if (!binEntry) {
    fail('Installed tsx package does not expose a CLI entry.');
  }

  return path.join(path.dirname(packageJsonPath), binEntry);
}

function parseRedisUrl(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    fail(`SESSION_STORE_REDIS_URL is invalid: ${url}`);
  }

  if (parsed.protocol !== 'redis:') {
    fail(`SESSION_STORE_REDIS_URL must start with redis://, got: ${url}`);
  }

  return {
    host: parsed.hostname || 'localhost',
    port: Number(parsed.port || '6379'),
  };
}

function canConnect({ host, port }) {
  return new Promise(resolve => {
    const socket = net.createConnection({ host, port });

    const done = ok => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(1500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

async function main() {
  if (!existsSync(path.join(demoDir, 'package.json'))) {
    fail(`Demo directory not found: ${demoDir}`);
  }

  const env = buildChildEnv();
  env.SESSION_STORE_REDIS_URL = redisUrl;
  applyOpenRouterDefaults(env);

  const hasAuth =
    Boolean(env.ANTHROPIC_API_KEY) ||
    Boolean(env.ANTHROPIC_AUTH_TOKEN);

  if (!hasAuth) {
    fail(
      'Missing credentials. Set either ANTHROPIC_API_KEY, or OPENROUTER_API_KEY (recommended if Anthropic region access is unavailable).',
    );
  }

  const redisTarget = parseRedisUrl(redisUrl);
  const redisOk = await canConnect(redisTarget);
  if (!redisOk) {
    fail(`Redis is not reachable at ${redisUrl}. Start Redis first, then rerun this script.`);
  }

  if (!existsSync(path.join(demoDir, 'node_modules'))) {
    console.log('[run-redis-demo] Installing example dependencies...');
    await run(npmCmd, ['install'], { cwd: demoDir, env });
  }

  let tsxCli = resolveTsxCli();
  if (!tsxCli) {
    console.log('[run-redis-demo] Installing local tsx runner...');
    await run(npmCmd, ['install', '--no-save', 'tsx'], { cwd: demoDir, env });
    tsxCli = resolveTsxCli();
  }

  if (!tsxCli) {
    fail('tsx CLI could not be resolved after installation.');
  }

  console.log(`[run-redis-demo] Running demo with Redis at ${redisUrl}`);
  if (env.ANTHROPIC_BASE_URL === 'https://openrouter.ai/api') {
    console.log('[run-redis-demo] Using OpenRouter compatibility mode');
    console.log(`[run-redis-demo] OpenRouter model override: ${env.OPENROUTER_MODEL}`);
  }

  await run(process.execPath, [tsxCli, 'demo.ts'], { cwd: demoDir, env });
}

main().catch(error => {
  fail(error instanceof Error ? error.message : String(error));
});
