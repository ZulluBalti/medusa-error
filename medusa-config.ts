import { loadEnv, defineConfig } from "@medusajs/framework/utils";
import path from "path";

loadEnv(process.env.NODE_ENV || "development", process.cwd());

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
    databaseDriverOptions:
      process.env.DB_SSL === "false"
        ? {}
        : { ssl: { rejectUnauthorized: false } },
  },

  modules: [
    { resolve: "./src/modules/brand" },
    { resolve: "./src/modules/meta_pixel" },
  ],

  admin: {
    vite: () => {
      // only override in dev
      if (process.env.NODE_ENV !== "development") {
        return {};
      }

      const appRoot = process.cwd(); // /app in your container

      return {
        // If you still have /src resolution issues, keep this:
        resolve: {
          alias: {
            "/src": path.join(appRoot, "src"),
          },
        },

        server: {
          host: "0.0.0.0",
          allowedHosts: ["localhost", ".localhost", "127.0.0.1"],
          fs: {
            allow: [appRoot],
          },
          hmr: {
            port: 5173,
            clientPort: 5173,
          },
        },
      };
    },
  },
});
