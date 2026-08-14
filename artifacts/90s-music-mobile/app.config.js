const fs = require("node:fs");
const path = require("node:path");
const app = require("./app.json");

// Expo starts from this nested mobile package, while deployment configuration is
// intentionally kept in the workspace root. Load that single source of truth
// without copying its values into this project or app configuration.
const envPath = path.resolve(__dirname, "../../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    const value = match[2].replace(/^(["'])(.*)\1$/, "$2");
    process.env[match[1]] = value;
  }
}

module.exports = {
  ...app.expo,
  extra: {
    ...app.expo.extra,
    // OAuth client identifiers and API origins are public runtime configuration.
    // Exposing them through Expo config keeps the root .env as the sole source.
    googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
  },
};
