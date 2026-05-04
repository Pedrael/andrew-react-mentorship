#!/usr/bin/env bash

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: ./scripts/rename-app.sh \"New App Name\""
  exit 1
fi

raw_name="$*"
package_name="$(printf '%s' "$raw_name" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9._-]+/-/g; s/^-+//; s/-+$//; s/-+/-/g')"

if [ -z "$package_name" ]; then
  echo "Could not generate a valid package name from: $raw_name"
  exit 1
fi

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

node - "$project_root" "$package_name" "$raw_name" <<'NODE'
const fs = require('fs');
const path = require('path');

const [projectRoot, packageName, appTitle] = process.argv.slice(2);

const packageJsonPaths = [
  path.join(projectRoot, 'client', 'package.json'),
  path.join(projectRoot, 'server', 'package.json'),
];
for (const packageJsonPath of packageJsonPaths) {
  if (!fs.existsSync(packageJsonPath)) continue;
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const suffix = packageJsonPath.includes(`${path.sep}server${path.sep}`) ? '-server' : '';
  packageJson.name = `${packageName}${suffix}`;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`);
  console.log(`Updated package name in ${path.relative(projectRoot, packageJsonPath)} to: ${packageJson.name}`);
}

const indexHtmlPath = path.join(projectRoot, 'client', 'index.html');
if (fs.existsSync(indexHtmlPath)) {
  const html = fs.readFileSync(indexHtmlPath, 'utf8');
  const nextHtml = html.replace(/<title>.*?<\/title>/s, `<title>${appTitle}</title>`);
  fs.writeFileSync(indexHtmlPath, nextHtml);
  console.log(`Updated document title to: ${appTitle}`);
}
NODE

echo "Rename complete."
