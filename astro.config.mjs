import { defineConfig } from "astro/config";
import partytown from "@astrojs/partytown";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  // temp github pages deployment
    site: 'https://kathhill.github.io',
    base: '/pixelhillpublishing',
    // end temp github page deployment
  integrations: [
    sitemap(),
    partytown({
      config: {
        forward: ["dataLayer.push"],
      },
    }),
  ],
});
