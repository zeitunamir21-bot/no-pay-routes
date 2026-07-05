import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.northgo.rides",
  appName: "NorthGo",
  webDir: "capacitor-shell",
  server: {
    url: "https://no-pay-routes.lovable.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
