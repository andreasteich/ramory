export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === 'rams') {
      if (path[1]) {
        const doId = path[1]

        let id = env.RAM.idFromName(doId)
        let stub = env.RAM.get(id);

        if (path[2] === 'flip-card') {
          const cardId = path[3]

          let newUrl = new URL(request.url);
          newUrl.pathname = `/flip-card/${cardId}`

          return await stub.fetch(newUrl);
        }

        
  
        let newUrl = new URL(request.url);
        newUrl.pathname = "/data"
  
        return await stub.fetch(newUrl);
      }

      if (request.method === 'POST') {
        const randomString = Math.random().toString().substr(2, 8)

        let id = env.RAM.idFromName(randomString)
        let stub = env.RAM.get(id);
  
        await stub.fetch(request);
        await env.RAM_REFS.put(randomString, 'RAM_REF')
  
        return new Response(JSON.stringify({ ramId: randomString }))
      } else if (request.method === 'GET') {
        const list = await env.RAM_REFS.list()
        return new Response(JSON.stringify([]))
      }
      
    } else if (path[0] === 'websocket') {
      let id = env.RAM.idFromName(path[1])
      let stub = env.RAM.get(id);

      const response = await stub.fetch(request)

      return response;
    } else {
      return new Response('nix')
    }
  }
}

type Player = {
  matchedPairs: number
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

// The de-facto unbiased shuffle algorithm is the Fisher-Yates (aka Knuth) Shuffle, says stackoverflow.com
function shuffle(deck: TrmCard[]) {
  let currentIndex = deck.length, randomIndex;

  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    [deck[currentIndex], deck[randomIndex]] = [deck[randomIndex], deck[currentIndex]];
  }

  return deck;
}

export class Ram {
  name: string | undefined
  topic: string | undefined
  isPrivate = true
  totalPairsMatched = 10
  player1: Player = { matchedPairs: 0 }
  player2: Player = { matchedPairs: 0 }
  deck: TrmCard[] = []
  isTurnOf: string | undefined

  state: DurableObjectState
  env: any

  constructor(state: DurableObjectState, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (url.pathname.includes('websocket')) {
      if (request.headers.get("Upgrade") != "websocket") {
        return new Response("expected websocket", {status: 400});
      }

      let ip = request.headers.get("CF-Connecting-IP");

      const [client, server] = Object.values(new WebSocketPair());

      if (!this.player1.websocket) {
        await this.handleSession(this.player1, server, ip);
      } else {
        await this.handleSession(this.player2, server, ip);
      }
      
      const headers = new Headers()
      headers.set('Access-Control-Allow-Origin', '*')
      const response = new Response(null, { status: 101, webSocket: client, headers });

      return response
    }

    switch (path[0]) {
      case 'rams': {
        const { topic, isPrivate, totalPairsMatched, username, cookie } = await request.json()

        this.topic = topic

        switch (topic) {
          case 'cars':
            this.deck = shuffle(DECK_CARS)
            break;
        }

        this.isPrivate = isPrivate
        this.totalPairsMatched = totalPairsMatched
        this.isTurnOf = 'player1'

        const player1: Player = {
          username,
          matchedPairs: 0,
          cookie
        }

        this.player1 = player1

        return new Response('Created')
      }

      case 'data': {
        const data = {
          topic: this.topic,
          isPrivate: this.isPrivate,
          totalPairsMatched: this.totalPairsMatched,
          isTurnOf: this.isTurnOf,
          player1: this.player1,
          player2: this.player2,
          deck: this.deck
        }

        return new Response(JSON.stringify(data))
      }

      default:
        return new Response("Not found", {status: 404});
    }
  }

  async handleSession(player: Player, webSocket: any, ip: string) {
    webSocket.accept();

    player.websocket = webSocket

    webSocket.onmessage = ({ data }) => {
      try {
        const { action, payload } = JSON.parse(data)

        switch (action) {
          case 'flipCard':
            this.deck.forEach(card => {
              if (card.id === payload) {
                card.clicked = !card.clicked
              }
            })

            const clickedCards = this.deck.filter(card => card.clicked)

            if (clickedCards.length >= 2) {
                setTimeout(() => {
                  if (clickedCards[0].imageUrl === clickedCards[1].imageUrl) {
                    if (this.isTurnOf === 'player1') {
                      this.player1.matchedPairs = this.player1.matchedPairs + 1
                    } else {
                      this.player2.matchedPairs = this.player2.matchedPairs + 1
                    }
                  }

                  this.isTurnOf = 'player1' ? 'player2' : 'player1'

                  this.deck.forEach(card => card.clicked = false)
                  this.deck = shuffle(this.deck)

                  this.player1.websocket?.send(JSON.stringify({ action: 'isTurnOf', payload: this.isTurnOf }))
                  this.player1.websocket?.send(JSON.stringify({ action: 'setPairsPlayer1', payload: this.player1.matchedPairs }))
                  this.player1.websocket?.send(JSON.stringify({ action: 'setPairsPlayer2', payload: this.player2.matchedPairs }))
                  this.player1.websocket?.send(JSON.stringify({ action: 'randomize', payload: this.deck.map(({ id }) => id) }))
                }, 1000)
            }

            this.player1.websocket?.send(JSON.stringify({ action: 'flipCard', payload }))
            break;
        }
        
      } catch (err) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({error: err.stack}));
      }
    };
  }
}