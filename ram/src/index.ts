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

          return new Response(null, { status: 200 })
        }

        return await stub.fetch(request)
      }

      if (request.method === 'POST') {
        const randomString = Math.random().toString().substr(2, 8)

        let id = env.RAM.idFromName(randomString)
        let stub = env.RAM.get(id);
  
        await stub.fetch(request);
  
        return new Response(JSON.stringify({ ramId: randomString }))
      } else if (request.method === 'GET') {
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
  cookie?: string | null
}

type TrmCard = {
  id?: string
  clicked: boolean
  imageUrl: string
  active: boolean
}

const PAIRS: string[] = ['🫐', '🫒', '🍕', '🥩', '🫑', '🥥', '🧄', '🥖', '🥫', '🥕', '🍟', '🍇']

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

function createTrmCards(images: string[], allowedPlayersInTotal = 1) {
  let defaultPairCount = 6

  const pairsInTotal = defaultPairCount + 2 * allowedPlayersInTotal

  const imagesToUse = []

  for (let i = 0; i < pairsInTotal; i++) {
    imagesToUse.push(images[i])
  }

  return imagesToUse
    .map<TrmCard>(image => ({
      clicked: false,
      imageUrl: image,
      active: true
    }))
    .flatMap(card => [card, card])
    .map((card, index) => ({ ...card, id: index.toString() }))
}

export class Ram {
  connections: { cookie: string, server: WebSocket }[] = []

  state: DurableObjectState
  env: any

  constructor(state: DurableObjectState, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request) {
    /*let headersObject = Object.fromEntries(request.headers)
    let requestHeaders = JSON.stringify(headersObject, null, 2)
    console.log(`Request headers: ${requestHeaders}`)*/

    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (url.pathname.includes('websocket')) {
      if (request.headers.get("upgrade") != "websocket") {
        return new Response("expected websocket", { status: 400 });
      }

      const cookie = request.url.split('?')[1].split('player=')[1]

      const players = await this.state.storage.get<Player[]>('players') ?? []
      const player = players.find(player => player.cookie === cookie)

      if (!player) {
        return new Response('You have to have a sesseion!', {status: 400});
      }

      const [client, server] = Object.values(new WebSocketPair());

      const connectionAlreadyEstablished = this.connections.find(connection => connection.cookie === cookie)

      if (connectionAlreadyEstablished) {
        console.log('already here', connectionAlreadyEstablished)
        connectionAlreadyEstablished.server = server 
      } else {
        console.log('new added', cookie)
        this.connections.push({ cookie, server })
      }

      console.log('connectinos', this.connections)
      
      await this.handleSession(server)
      
      
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

            let players = await this.state.storage.get<Player[]>('players') ?? []

            const playerToRemove = { ...players.find(player => player.cookie === cookie) }

            if (!playerToRemove) {
              return new Response('Something went wrong, contact the developers')
            }
            
            players = players.filter(player => player.cookie !== cookie)
            
            if (!players.length) {
              await this.state.storage.deleteAll()
              return new Response('No players, RAM destroyed.')
            }

            await this.state.storage.put('players', players)

            this.broadcast({ action: 'playerLeft', payload: playerToRemove.username })

            return new Response('Player left ' + playerToRemove.username)
          }

          if (request.method === 'GET') {
            const allowedPlayersInTotal = await this.state.storage.get('allowedPlayersInTotal')
            const deck = await this.state.storage.get<TrmCard[]>('deck')

            let players = await this.state.storage.get<Player[]>('players') ?? []
            let isTurnOf = await this.state.storage.get('isTurnOf')
        
            const data = {
              allowedPlayersInTotal,
              isPrivate: true,
              isTurnOf,
              players,
              deck
            }
  
            return new Response(JSON.stringify(data))
          } else if (path[2] === 'join' && request.method === 'POST') {
            const { username, cookie } = await request.json()

            let players = await this.state.storage.get<Player[]>('players') ?? []
            let isTurnOf = await this.state.storage.get('isTurnOf')
            
            const playerAlreadyExists = players.find(player => player.cookie === cookie)
  
            if (!playerAlreadyExists && cookie) {
              players.push({ username, cookie, matchedPairs: 0 })
              this.broadcast({ action: 'playerJoined', payload: { username, matchedPairs: 0, itsMe: false } })
            }
  
            if (!isTurnOf) {
              isTurnOf = players[0].username
            }
  
            const data = {
              isTurnOf,
              players: players.map(player => ({ 
                username: player.username, 
                itsMe: player.cookie === cookie, 
                matchedPairs: player.matchedPairs 
              }))
            }

            await this.state.storage.put('players', players)
            await this.state.storage.put('isTurnOf', isTurnOf)
  
            return new Response(JSON.stringify(data))
          }
        }

        const { isPrivate, allowedPlayersInTotal, topic } = await request.json()

        await this.state.storage.put('allowedPlayersInTotal', allowedPlayersInTotal)
        await this.state.storage.put('topic', topic)
        await this.state.storage.put('deck', shuffle(createTrmCards(PAIRS, allowedPlayersInTotal)))

        return new Response(JSON.stringify({ isPrivate }))
      }

      default:
        return new Response("Not found", {status: 404});
    }
  }

  private async broadcast(action: any, exceptPlayerWithCookie: string | undefined = undefined) {
    this.connections.forEach(({ cookie, server }) => {
      if (cookie === exceptPlayerWithCookie) {
        return
      }

      server.send(JSON.stringify(action))
    })
  }

  private async handleSession(webSocket: any) {
    webSocket.accept();

    webSocket.addEventListener('message', async ({ data }) => {
      try {
        const { action, payload } = JSON.parse(data)

        switch (action) {
          case 'flipCard':
            let deck = await this.state.storage.get<TrmCard[]>('deck') ?? []

            deck.forEach(card => {
              if (card.id === payload) {
                card.clicked = !card.clicked
              }
            })

            const clickedCards = deck.filter(card => card.clicked)

            let players = await this.state.storage.get<Player[]>('players') ?? []

            if (clickedCards.length === 2) {
              setTimeout(async () => {
                let isTurnOf = await this.state.storage.get<string>('isTurnOf')

                if (clickedCards[0].imageUrl === clickedCards[1].imageUrl) {
                  this.broadcast({ action: 'pairFound', payload: [clickedCards[0].id, clickedCards[1].id] })

                  const playerToAdjust = players.find(player => player.username === isTurnOf)

                  // TODO: throw error
                  if (!playerToAdjust) {
                    console.error('Not possible?!')
                    return
                  }

                  playerToAdjust.matchedPairs = playerToAdjust.matchedPairs + 1
                  this.broadcast({ action: 'incrementPairsOfPlayer', payload: playerToAdjust.username })

                  clickedCards[0].active = false
                  clickedCards[1].active = false

                  const allPairsFound = deck.find(card => card.active)
                  
                  if (allPairsFound) {
                    const winner = players.reduce((previousPlayer, currentPlayer) => {
                      if (previousPlayer.matchedPairs > currentPlayer.matchedPairs) {
                        return previousPlayer
                      } else {
                        return currentPlayer
                      }
                    })

                    const { username, websocket } = winner
                    
                    this.broadcast(players, { action: 'youLost' }, username)
                    websocket?.send(JSON.stringify({ action: 'youWon' }))
                  }
                } else {
                  const currentPlayersIndex = players.findIndex(player => player.username === isTurnOf)
                  
                  try {
                    isTurnOf = players[currentPlayersIndex + 1].username
                  } catch(e) {
                    isTurnOf = players[0].username
                  }

                  this.broadcast({ action: 'noMatch' })
                  this.broadcast({ action: 'isTurnOf', payload: isTurnOf })
                }

                deck.forEach(card => card.clicked = false)

                await this.state.storage.put('deck', deck)
                await this.state.storage.put('players', players)
                await this.state.storage.put('isTurnOf', isTurnOf)
              }, 1000)
            }

            this.broadcast({ action: 'flipCard', payload })

            this.state.storage.put('deck', deck)
            break;
        }
        
      } catch (err) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({error: err.stack}));
      }
    })

  }
}