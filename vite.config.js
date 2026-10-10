import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Repository Pages URL: https://vitaliyarmss.github.io/task-manager-frontend/
  base: '/task-manager-frontend/',
});
