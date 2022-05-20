export default {
  async fetch(request: Request, env) {

    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === 'rams' && path[1]) {
      let id = env.RAM.idFromName(path[1])
      let stub = env.RAM.get(id);

      let newUrl = new URL(request.url);
      newUrl.pathname = "/data"

      return await stub.fetch(newUrl);
    } else if (path[0] === 'rams') {
      if (request.method === 'POST') {
        const randomString = Math.random().toString().substr(2, 8)

        let id = env.RAM.idFromName(randomString)
        let stub = env.RAM.get(id);
  
        await stub.fetch(request);
        await env.RAM_REFS.put(randomString, 'RAM_REF')
  
        return new Response(JSON.stringify({ ramId: randomString }))
      } else if (request.method === 'GET') {
        const list = await env.RAM_REFS.list()
        console.log('list', list)
        return new Response(JSON.stringify([]))
      }
      
    } else {
      return new Response()
    }
  }
}

type Player = {
  matchedPairs?: number
  websocket?: WebSocket
  username?: string
  cookie?: string
}

type TrmCard = {
  id: string;
  clicked: boolean;
  imageUrl: string;
}

const DECK_CARS: TrmCard[] = [
  {
      id: '1',
      clicked: false,
      imageUrl: 'model-s.jpg'
  },
  {
      id: '2',
      clicked: false,
      imageUrl: 'roadster-social.jpg'
  },
  {
      id: '3',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '4',
      clicked: false,
      imageUrl: 'model-s.jpg'
  },
  {
      id: '5',
      clicked: false,
      imageUrl: 'roadster-social.jpg'
  },
  {
      id: '6',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '7',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '8',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '9',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '10',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '11',
      clicked: false,
      imageUrl: ''
  },
  {
      id: '12',
      clicked: false,
      imageUrl: ''
  }
]

export class Ram {
  name: string | undefined
  topic: string | undefined
  isPrivate = true
  totalPairsMatched = 10
  player1: Player = {}
  player2: Player = {}
  deck: TrmCard[] = []

  state: DurableObjectState
  env: any

  constructor(state: DurableObjectState, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    let url = new URL(request.url);
    console.log('url', url.pathname)

    switch (url.pathname) {
      case '/rams': {
        const { topic, isPrivate, totalPairsMatched, username, cookie } = await request.json()

        this.topic = topic

        switch (topic) {
          case 'cars':
            this.deck = DECK_CARS
            break;
        }

        this.isPrivate = isPrivate
        this.totalPairsMatched = totalPairsMatched

        const player1: Player = {
          username,
          matchedPairs: 0,
          cookie
        }

        this.player1 = player1

        return new Response('Created')
      }
      
      case '/data': {
        const data = {
          topic: this.topic,
          isPrivate: this.isPrivate,
          totalPairsMatched: this.totalPairsMatched,
          player1: this.player1,
          player2: this.player2,
          deck: this.deck
        }

        return new Response(JSON.stringify(data))
      }
      case '/websocket': {

      }
      default:
        return new Response("Not found", {status: 404});
    }
  }
}