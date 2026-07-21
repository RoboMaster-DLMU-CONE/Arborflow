const { spawnSync } = require('node:child_process');

const platformTarget = {
  darwin: 'mac',
  linux: 'linux',
  win32: 'win',
};

const target = platformTarget[process.platform];
if (!target) {
  console.error(`Unsupported packaging platform: ${process.platform}`);
  process.exit(1);
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const result = spawnSync(npmCommand, ['run', `dist:${target}`], {
  stdio: 'inherit',
});

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
