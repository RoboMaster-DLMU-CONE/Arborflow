const { createHash } = require('node:crypto');
const { createReadStream, promises: fs } = require('node:fs');
const path = require('node:path');

const [directory, artifactName] = process.argv.slice(2);
if (!directory || !artifactName) {
  console.error('Usage: node scripts/write-checksums.cjs <directory> <artifact-name>');
  process.exit(1);
}

const releaseExtensions = new Set([
  '.AppImage',
  '.blockmap',
  '.deb',
  '.dmg',
  '.exe',
  '.zip',
]);

function hashFile(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    const stream = createReadStream(filePath);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function main() {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && releaseExtensions.has(path.extname(entry.name)))
    .sort((left, right) => left.name.localeCompare(right.name));

  if (files.length === 0) {
    throw new Error(`No release packages found in ${directory}`);
  }

  const lines = [];
  for (const file of files) {
    lines.push(`${await hashFile(path.join(directory, file.name))}  ${file.name}`);
  }

  const output = path.join(directory, `SHA256SUMS-${artifactName}.txt`);
  await fs.writeFile(output, `${lines.join('\n')}\n`, 'ascii');
  console.log(`Wrote ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
