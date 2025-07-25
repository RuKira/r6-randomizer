import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/r6-randomizer/',
  plugins: [react()],
});
