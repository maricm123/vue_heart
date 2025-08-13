import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'
export default defineConfig({
  css: {
    preprocessorOptions: {
      css: {
        // Dodajte potrebne opcije ovde
      },
    },
  },
  plugins: [vue()],
});
