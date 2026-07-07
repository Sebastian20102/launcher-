import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

function removeLocalLibraryArtifacts() {
  return {
    name: 'remove-local-library-artifacts',
    closeBundle() {
      const targets = [
        path.resolve(__dirname, 'dist/library.generated.json'),
        path.resolve(__dirname, 'dist/app-icons'),
      ]

      for (const target of targets) {
        fs.rmSync(target, { recursive: true, force: true })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), removeLocalLibraryArtifacts()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
