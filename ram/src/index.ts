export default {
  async fetch(request, env) {
    let id = env.RAM.idFromName("Hello World Ram");
    let stub = env.RAM.get(id);
    let response = await stub.fetch(request);
    // let name = await resp.text();

    return response
  }
}

export class Ram {
  name: string | undefined = undefined

  constructor(state, env) {}

  async fetch(request: Request) {
    let url = new URL(request.url);
    console.log(url.pathname)

    let path = url.pathname.slice(1).split('/');
    switch (url.pathname) {
      case '/rams': {
        const { name } = await request.json();

        this.name = name

        return new Response('Created' + this.name)
      }

      default:
        return new Response("Not found", {status: 404});
    }
  }
}