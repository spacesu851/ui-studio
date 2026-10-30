import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
export default defineConfig({root:fileURLToPath(new URL('.',import.meta.url)),base:'/updates/',publicDir:false,plugins:[react()],build:{outDir:fileURLToPath(new URL('../../../opsu-updates',import.meta.url)),emptyOutDir:false}});
