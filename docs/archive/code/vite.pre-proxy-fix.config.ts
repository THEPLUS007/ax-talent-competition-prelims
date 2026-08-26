import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({base:'./',plugins:[react()],preview:{host:'0.0.0.0',port:5173,strictPort:true,allowedHosts:true},server:{host:'0.0.0.0',port:5173,strictPort:true,allowedHosts:true,proxy:{'/api':{target:'http://localhost:3000',changeOrigin:true}}}});
