import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import tsconfigPaths from 'vite-tsconfig-paths'

const commonConfig = {
  plugins: [react(), tsconfigPaths(), nodePolyfills()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
    modules: {
      generateScopedName: '[name]__[local]___[hash:base64:5]',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
  },
}

export default defineConfig(({ mode }) => {
  if (mode === 'demo') {
    // デモ・テストページ用の設定
    return {
      ...commonConfig,
      base: './',
      build: {
        outDir: 'dist/app',
        rollupOptions: {
          input: resolve(__dirname, 'index.html'),
          output: {
            format: 'iife',
            entryFileNames: 'bundle.js',
          },
        },
        minify: true,
        sourcemap: false,
        chunkSizeWarningLimit: 1000,
        assetsInlineLimit: 4096,
      },
    }
  }

  // ライブラリビルド用の設定（デフォルト）
  return {
    ...commonConfig,
    server: {
      port: 5173,
      strictPort: true,
      host: true,
      open: true,
      historyApiFallback: true,
      middlewareMode: false,
      fs: {
        strict: false,
        allow: ['..']
      }
    },
    build: {
      outDir: 'dist/app',
      minify: false,
      lib: {
        entry: resolve(__dirname, 'src/index.tsx'),
        name: 'NeroWallet',
        fileName: 'bundle',
        formats: ['es'],
      },
      cssCodeSplit: false,
      cssMinify: false,
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          inlineDynamicImports: true,
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM',
          },
        },
      },
    },
  }
})
