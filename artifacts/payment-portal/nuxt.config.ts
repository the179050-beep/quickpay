export default defineNuxtConfig({
  ssr: false,
  telemetry: false,

  compatibilityDate: "2025-01-01",

  devServer: {
    port: Number(process.env["PORT"]) || 3000,
    host: "0.0.0.0",
  },

  modules: ["@nuxtjs/tailwindcss"],

  tailwindcss: {
    cssPath: "~/assets/css/main.css",
    configPath: "~/tailwind.config.ts",
    exposeConfig: false,
  },

  app: {
    head: {
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Zain:wght@200;300;400;700;800;900&display=swap",
        },
      ],
      title: "زين الكويت - الدفع السريع",
    },
    baseURL: "/",
  },

  nitro: {
    preset: "static",
  },

  vite: {
    server: {
      allowedHosts: true,
    },
  },

  runtimeConfig: {
    public: {
      apiBase: "/api",
    },
  },
});
