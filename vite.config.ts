import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: [
                'favicon.ico',
                'favicon.svg',
                'icons/apple-touch-icon.png',
                'icons/icon-192.png',
                'icons/icon-512.png',
                'fonts/Dosis-Regular.ttf',
                'fonts/Dosis-SemiBold.ttf',
                'fonts/Dosis-Light.ttf',
                'fonts/OFL.txt',
            ],
            manifest: {
                name: 'Hex-udoku',
                short_name: 'Hex-udoku',
                description: 'A hexagonal Sudoku game',
                theme_color: '#E0E7FF',
                icons: [
                    {
                        src: 'icons/icon-192.png',
                        sizes: '192x192',
                        type: 'image/png',
                    },
                    {
                        src: 'icons/icon-512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
        }),
    ],
});
