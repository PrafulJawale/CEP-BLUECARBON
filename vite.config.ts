import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'KARBON - BlueCarbon MRV -National Carbon Credit Registry',
        short_name: 'BlueCarbon MRV',
        description: 'Government of India\'s National Carbon Credit Registry for Blue Carbon Projects - Monitoring, Reporting & Verification',
        theme_color: '#2563eb',
        background_color: '#0a4d68',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'c6.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'c6.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        shortcuts: [
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'View your carbon credit dashboard',
            url: '/dashboard',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'Upload Project',
            short_name: 'Upload',
            description: 'Upload a new restoration project',
            url: '/upload',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'Registry',
            short_name: 'Registry',
            description: 'Browse verified carbon projects',
            url: '/registry',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'Marketplace',
            short_name: 'Market',
            description: 'Buy and sell carbon credits',
            url: '/marketplace',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'GIS Mapping',
            short_name: 'GIS',
            description: 'Explore project locations and data',
            url: '/gis-mapping',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'Carbon Wallet',
            short_name: 'Wallet',
            description: 'Manage your carbon credits',
            url: '/wallet',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'IoT Sensors',
            short_name: 'IoT',
            description: 'Monitor IoT sensor data',
            url: '/iot-simulation',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          },
          {
            name: 'Analytics',
            short_name: 'Analytics',
            description: 'View detailed analytics and reports',
            url: '/analytics',
            icons: [{ src: 'c6.png', sizes: '96x96' }]
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
