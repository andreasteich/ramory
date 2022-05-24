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
      console.log('in worker', request.headers.get('Cookie'))

      let id = env.RAM.idFromName(path[1])
      let stub = env.RAM.get(id);

      const response = await stub.fetch(request)

      return response;
    } else {
      return new Response('nix')
    }
  }
}

const PAIRS: string[] = ['🫐', '🫒', '🍕', '🥩', '🫑', '🥥', '🧄', '🥖', '🥫']

function shuffle(array: TrmCard[]) {
  let counter = array.length;

  while (counter > 0) {
      let index = Math.floor(Math.random() * counter);

      counter--;

      let temp = array[counter];
      array[counter] = array[index];
      array[index] = temp;
  }

  return array;
}

function createTrmCards(images: string[]) {
  return images
    .map<TrmCard>(image => ({
      id: '',
      clicked: false,
      imageUrl: image,
      active: true
    }))
    .flatMap(card => [card, card])
    .map((card, index) => ({ ...card, id: index.toString() }))
}

export class Ram {
  allowedPlayersInTotal = 2
  isPrivate = true
  totalPairs = 6
  players: Player[] = []
  deck: TrmCard[] = shuffle(createTrmCards(PAIRS))
  isTurnOf: string | undefined

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
      if (request.headers.get("upgrade") != "websocket") {
        return new Response("expected websocket", { status: 400 });
      }

      const cookie = request.url.split('?')[1].split('player=')[1]

      console.log('value', cookie)

      const ip = request.headers.get("CF-Connecting-IP");

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
              allowedPlayersInTotal: this.allowedPlayersInTotal,
              isPrivate: this.isPrivate,
              isTurnOf: this.isTurnOf,
              players: this.players.map(player => ({ 
                username: player.username, 
                itsMe: player.cookie === cookie, 
                matchedPairs: player.matchedPairs 
              })),
              deck: this.deck
            }

            this.broadcast({ action: 'playerJoined', payload: { username, matchedPairs: 0, itsMe: false } })
  
            return new Response(JSON.stringify(data))
          }
        }

        const { isPrivate, allowedPlayersInTotal } = await request.json()

        this.allowedPlayersInTotal = allowedPlayersInTotal

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