import { spawn } from 'node:child_process';

const children = [];

function run(name, command, args) {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    env: process.env,
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      return;
    }

    if (code && code !== 0) {
      console.error(`${name} exited with code ${code}`);
      shutdown(code);
    }
  });

  children.push(child);
}

function shutdown(exitCode = 0) {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }

  process.exit(exitCode);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

run('server', 'npx', ['tsx', 'watch', 'server/index.ts']);
run('client', 'npx', ['vite', '--port=3000', '--host=0.0.0.0']);
