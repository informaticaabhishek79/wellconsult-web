import type { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'com.deemona.doctors',
  appName: 'Deemona Doctors',
  webDir: 'dist',
  server: {
    url: 'https://doctors.deemona.com',
    cleartext: false,
    androidScheme: 'https'
  }
};
export default config;