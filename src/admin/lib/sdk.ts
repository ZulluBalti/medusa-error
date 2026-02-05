import Medusa from "@medusajs/js-sdk"

export const sdk = new Medusa({
  baseUrl: import.meta.env.VITE_BACKEND_URL || "/",
  // debug: import.meta.env.DEV,
  debug: true,
  auth: {
    type: "session",
  },
})
