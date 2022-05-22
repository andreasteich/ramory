export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === 'rams') {
      if (path[1]) {
        const doId = path[1]

        let id = env.RAM.idFromName(doId)
        let stub = env.RAM.get(id);

        if (path[2] === 'leave' && request.method === 'DELETE') {
          const response = await stub.fetch(request)
          const { ramToDelete } = await response.json()

          await env.RAM_REFS.delete(doId)

          return new Response(null, { status: 200 })
        }

        return await stub.fetch(request)
      }

      if (request.method === 'POST') {
        const randomString = Math.random().toString().substr(2, 8)

        let id = env.RAM.idFromName(randomString)
        let stub = env.RAM.get(id);
  
        const response = await stub.fetch(request);
        const { isPrivate } = await response.json()

        if (!isPrivate) {
          // await env.RAM_REFS.put(randomString, 'RAM_REF')
        } 
  
        return new Response(JSON.stringify({ ramId: randomString }))
      } else if (request.method === 'GET') {
        //const list = await env.RAM_REFS.list()
        const list = []

        return new Response(JSON.stringify(list))
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
  cookie?: string | null
}

type TrmCard = {
  id: string
  clicked: boolean
  imageUrl: string
  active: boolean
}

const DECK_CARS: TrmCard[] = [
  {
      id: '1',
      clicked: false,
      imageUrl: 'model-s.jpg',
      active: true
  },
  {
      id: '2',
      clicked: false,
      imageUrl: 'roadster-social.jpg',
      active: true
  },
  {
      id: '3',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '4',
      clicked: false,
      imageUrl: 'model-s.jpg',
      active: true
  },
  {
      id: '5',
      clicked: false,
      imageUrl: 'roadster-social.jpg',
      active: true
  },
  {
      id: '6',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '7',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '8',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '9',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '10',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '11',
      clicked: false,
      imageUrl: '',
      active: true
  },
  {
      id: '12',
      clicked: false,
      imageUrl: '',
      active: true
  }
]

export class Ram {
  playerLimit: number = 2
  isPrivate = true
  totalPairs = 6
  topic: string | undefined
  players: Player[] = []
  deck: TrmCard[] = []
  isTurnOf: string | undefined
  
  // player1: Player = { matchedPairs: 0 }
  // player2: Player = { matchedPairs: 0 }

  state: DurableObjectState
  env: any

  constructor(state: DurableObjectState, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    let headersObject = Object.fromEntries(request.headers)
    let requestHeaders = JSON.stringify(headersObject, null, 2)
    console.log(`Request headers: ${requestHeaders}`)

    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (url.pathname.includes('websocket')) {
      if (request.headers.get("Upgrade") != "websocket") {
        return new Response("expected websocket", { status: 400 });
      }

      const cookie = request.headers.get('Cookie')
      if (cookie) { console.log('found cookie')}

      let ip = request.headers.get("CF-Connecting-IP");

      const [client, server] = Object.values(new WebSocketPair());

      const player = this.players.find(player => player.cookie === cookie)

      if (!player) {
        return new Response('You have to have a sesseion!', {status: 400});
      }

      await this.handleSession(player, server, ip)
      
      // TODO: test without access-control-allow-origin header (security risk?)
      const headers = new Headers()
      headers.set('Access-Control-Allow-Origin', '*')
      const response = new Response(null, { status: 101, webSocket: client, headers });

      return response
    }

    switch (path[0]) {
      // TODO: would be nice to rewrite to something like /create or /new
      case 'rams': {
        const ramId = path[1]

        if (ramId) {
          if (path[2] === 'leave' && request.method === 'DELETE') {
            const cookie = request.headers.get('Cookie')

            const playerToRemove = { ...this.players.find(player => player.cookie === cookie) }

            if (!playerToRemove) {
              return new Response('Something went wrong, contact the developers')
            }
            
            this.players = this.players.filter(player => player.cookie !== cookie)
            console.log(this.players)

            this.broadcast({ action: 'playerLeft', payload: playerToRemove.username })

            let ramToDelete = false

            if (!this.players.length) {
              this.state.storage.deleteAll()
              ramToDelete = true
            }

            return new Response(JSON.stringify({ ramToDelete }))
          }

          if (request.method === 'POST') {
            const { username, cookie } = await request.json()

            const playerAlreadyExists = this.players.find(player => player.cookie === cookie)
  
            if (!playerAlreadyExists && cookie) {
              this.players.push({ username, cookie, matchedPairs: 0 })
            }
  
            if (!this.isTurnOf) {
              this.isTurnOf = this.players[0].username
            }
  
            const data = {
              topic: this.topic,
              isPrivate: this.isPrivate,
              isTurnOf: this.isTurnOf,
              players: this.players.map(player => ({ 
                username: player.username, 
                itsMe: player.cookie === cookie, 
                matchedPairs: player.matchedPairs 
              })),
              deck: this.deck
            }

            // this.broadcast({ action: 'playerJoined', payload:  })
  
            return new Response(JSON.stringify(data))
          }
        }

        const { topic, isPrivate } = await request.json()

        this.topic = topic

        switch (topic) {
          case 'cars':
            this.deck = DECK_CARS
            break;
        }

        this.isPrivate = isPrivate

        return new Response(JSON.stringify({ isPrivate }))
      }

      default:
        return new Response("Not found", {status: 404});
    }
  }

  private broadcast(action: any, exceptPlayerWithUsername: string | undefined = undefined) {
    this.players.forEach(player => {
      if (player.username === exceptPlayerWithUsername) {
        return
      }

      player.websocket?.send(JSON.stringify(action))
    })
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

            if (clickedCards.length === 2) {
                setTimeout(() => {
                  if (clickedCards[0].imageUrl === clickedCards[1].imageUrl) {
                    this.broadcast({ action: 'pairFound', payload: [clickedCards[0].id, clickedCards[1].id] })

                    const playerToAdjust = this.players.find(player => player.username === this.isTurnOf)

                    // TODO: throw error
                    if (!playerToAdjust) {
                      console.error('Not possible?!')
                      return
                    }

                    playerToAdjust.matchedPairs = playerToAdjust.matchedPairs + 1
                    this.broadcast({ action: 'incrementPairsOfPlayer', payload: playerToAdjust.username })

                    clickedCards[0].active = false
                    clickedCards[1].active = false

                    const allPairsFound = !this.deck.find(card => card.active)
                    
                    if (allPairsFound) {
                      const winner = this.players.reduce((previousPlayer, currentPlayer) => {
                        if (previousPlayer.matchedPairs > currentPlayer.matchedPairs) {
                          return previousPlayer
                        } else {
                          return currentPlayer
                        }
                      })

                      const { username, websocket } = winner
                      
                      this.broadcast({ action: 'youLost' }, username)
                      websocket?.send(JSON.stringify({ action: 'youWon' }))
                    }
                  } else {
                    const currentPlayersIndex = this.players.findIndex(player => player.username === this.isTurnOf)
                    
                    try {
                      this.isTurnOf = this.players[currentPlayersIndex + 1].username
                    } catch(e) {
                      this.isTurnOf = this.players[0].username
                    }

                    this.broadcast({ action: 'noMatch' })
                    this.broadcast({ action: 'isTurnOf', payload: this.isTurnOf })
                  }

                  this.deck.forEach(card => card.clicked = false)
                }, 1000)
            }

            this.broadcast({ action: 'flipCard', payload })
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