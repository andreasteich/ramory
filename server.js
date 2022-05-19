import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import { createCloudflareKVSessionStorage } from "@remix-run/cloudflare"
import * as build from "@remix-run/dev/server-build";

const handleRequest = createPagesFunctionHandler({
  build,
  mode: process.env.NODE_ENV,
  getLoadContext: (context) => {
    console.log('storage', context.env.sessionStorage, process.env.NODE_ENV)
    const sessionStorage = createCloudflareKVSessionStorage({
      cookie: {
        name: "__ramory",
        secrets: ["ahola-2022"],
        secure: process.env.NODE_ENV !== 'development',
        sameSite: "strict",
      },
      kv: context.env.sessionStorage,
    })

    return { sessionStorage }
  }
});

export function onRequest(context) {
  return handleRequest(context);
}
