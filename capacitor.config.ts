import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'app.petworth.mobile',
  appName: 'Pet Worth',
  webDir: 'dist',
  server: {
    iosScheme: 'https',
  },
}

export default config
