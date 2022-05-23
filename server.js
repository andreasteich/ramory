import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { createCloudflareKVSessionStorage } from "@remix-run/cloudflare"
import * as build from "@remix-run/dev/server-build";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => {
    const sessionStorage = createCloudflareKVSessionStorage({
      cookie: {
        name: "__ramory",
        secrets: ["ahola-2022"],
        secure: process.env.NODE_ENV !== 'development',
        sameSite: "strict",
      },
      kv: context.env.sessionStorage,
    })

    return { sessionStorage, env: context.env }
  }
});

export function onRequest(context) {
  return handleRequest(context);
}
