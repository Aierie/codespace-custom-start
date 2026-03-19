const esbuild = require('esbuild');

async function main() {
  await esbuild.build({
    entryPoints: ['extension.js'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node22',
    external: ['vscode'],
    outfile: 'dist/extension.js',
    sourcemap: true,
    logLevel: 'info'
  });
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
