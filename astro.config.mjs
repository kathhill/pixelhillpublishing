import { defineConfig } from "astro/config";
import icon from "astro-icon";
import partytown from "@astrojs/partytown";

import sitemap from "@astrojs/sitemap";

import tailwindcss from "@tailwindcss/postcss";

// https://astro.build/config
export default defineConfig({
  site: 'https:pixelhillpublishing.com',

  integrations: [
    sitemap(),
    icon(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],

  vite: {
    css: {
      postcss: {
        plugins: [tailwindcss()],
      },
    },
  },
});