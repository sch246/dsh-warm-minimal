import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['lib/types/remote.js'],
  outDir: 'lib',
  format: ['esm'],
  platform: 'node',
  target: 'es2024',
  fixedExtension: false,
  dts: false,
  clean: false,
})
