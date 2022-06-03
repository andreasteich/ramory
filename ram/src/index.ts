export default {
  async fetch(request, env) {
    let url = new URL(request.url);
    let path = url.pathname.slice(1).split('/');

    if (path[0] === 'boards') {
      if (path[1]) {
        const doId = path[1]

        let id = env.RAM.idFromName(doId)
        let stub = env.RAM.get(id);

        if (path[2] === 'leave' && request.method === 'DELETE') {
          await stub.fetch(request)

          return new Response(null, { status: 200 })
        }

        return await stub.fetch(request)
      }

      if (request.method === 'POST') {
        const randomString = Math.random().toString().substr(2, 8)

        let id = env.RAM.idFromName(randomString)
        let stub = env.RAM.get(id);
  
        await stub.fetch(request);
  
        return new Response(JSON.stringify({ boardId: randomString }))
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
  incorrectMatches: number
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

enum HistorySliceType {
  JOINED = 'JOINED',
  PAIR_FOUND = 'PAIR_FOUND',
  LEFT = 'LEFT',
  BOARD_CREATED = 'BOARD_CREATED',
  STARTED = 'STARTED',
  QUICK_REACTION = 'QUICK_REACTION',
  IS_TURN_OF = 'IS_TURN_OF',
  ROUND_OVER = 'ROUND_OVER',
  ROUND_STARTED = 'ROUND_STARTED',
  ROUNDS_TO_PLAY_OVER = 'ROUNDS_TO_PLAY_OVER',
  OVERALL_RESULT = 'OVERALL_RESULT',
  NO_MATCH = 'NO_MATCH',
  NO_MATCH_WITH_WITHDRAW = 'NO_MATCH_WITH_WITHDRAW',
  NO_MATCH_WITHOUT_WITHDRAW = 'NO_MATCH_WITHOUT_WITHDRAW'
}

type HistorySlice = {
  type: HistorySliceType
  relatedTo: 'syslog' | string
  message?: string
}

type BoardStats = {
  currentState: string
  roundsToPlay: number
  currentRound: number
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

function createChipSet(images: string[]) {
  const imagesToUse = []

  for (let i = 0; i < 12; i++) {
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
        connectionAlreadyEstablished.server = server 
      } else {
        this.connections.push({ cookie, server })
      }
      
      await this.handleSession(server)
      
      
      // TODO: test without access-control-allow-origin header (security risk?)
      const headers = new Headers()
      headers.set('Access-Control-Allow-Origin', '*')
      const response = new Response(null, { status: 101, webSocket: client, headers });

      return response
    }

    switch (path[0]) {
      // TODO: would be nice to rewrite to something like /create or /new
      case 'boards': {
        const boardId = path[1]

        if (boardId) {
          if (request.method === 'GET') {
            const deck = await this.state.storage.get<TrmCard[]>('deck')

            let players = await this.state.storage.get<Player[]>('players') ?? []
            let isTurnOf = await this.state.storage.get('isTurnOf')
            let boardStats = await this.state.storage.get<BoardStats>('boardStats') ?? { currentRound: 0, currentState: 'poweredOff', roundsToPlay: 0 }
            let boardHistory = await this.state.storage.get<HistorySlice[]>('boardHistory') ?? []
        
            const data = {
              isTurnOf,
              players,
              deck,
              boardStats,
              boardHistory
            }
  
            return new Response(JSON.stringify(data))
          } else if (path[2] === 'join' && request.method === 'POST') {
            const { username, cookie } = await request.json()

            let players = await this.state.storage.get<Player[]>('players') ?? []
            let isTurnOf = await this.state.storage.get('isTurnOf')
            let boardStats = await this.state.storage.get<BoardStats>('boardStats') ?? { currentRound: 0, currentState: 'poweredOff', roundsToPlay: 0 }
            let boardHistory = await this.state.storage.get<HistorySlice[]>('boardHistory') ?? []
            
            const playerAlreadyExists = players.find(player => player.cookie === cookie)

            if (!playerAlreadyExists && cookie) {
              players.push({ username, cookie, matchedPairs: 0, incorrectMatches: 0 })
              
              boardHistory.push({ type: HistorySliceType.JOINED, relatedTo: 'syslog', message: `${username} joined the board` })

              // TODO: remove itsMe?
              this.broadcast({ action: 'playerJoined', payload: { username, matchedPairs: 0, incorrectMatches: 0, itsMe: false } })
            }
  
            if (!isTurnOf) {
              isTurnOf = players[0].username
              boardHistory.push({ type: HistorySliceType.IS_TURN_OF, relatedTo: 'syslog', message: `Is turn of ${username}` })
            }

            boardStats.roundsToPlay = boardStats.roundsToPlay + 1
  
            const data = {
              isTurnOf,
              players: players.map(player => ({ 
                username: player.username, 
                itsMe: player.cookie === cookie, 
                matchedPairs: player.matchedPairs,
                incorrectMatches: player.incorrectMatches
              })),
              boardStats,
              boardHistory: boardHistory.map(historySlice => {
                return {
                  from: historySlice.relatedTo,
                  message: historySlice.message
                }
              })
            }

            await this.state.storage.put('players', players)
            await this.state.storage.put('isTurnOf', isTurnOf)
            await this.state.storage.put('boardStats', boardStats)
            await this.state.storage.put('boardHistory', boardHistory)
  
            return new Response(JSON.stringify(data))
          }
        }

        await this.state.storage.put<HistorySlice[]>('boardHistory', [{ type: HistorySliceType.BOARD_CREATED, relatedTo: 'syslog', message: 'Board created' }])
        await this.state.storage.put('deck', shuffle(createChipSet(PAIRS)))

        const boardStats: BoardStats = {
          currentState: 'poweredOff',
          roundsToPlay: 0,
          currentRound: 1
        }

        await this.state.storage.put('boardStats', boardStats)

        return new Response('Board created')
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

        const boardHistory = await this.state.storage.get<HistorySlice[]>('boardHistory')
        const boardStats = await this.state.storage.get<BoardStats>('boardStats')

        if (!boardStats) return

        switch (action) {
          case 'quickReaction':
            const cookie = this.connections.find(connection => connection.server === webSocket)?.cookie
            const players1 = await this.state.storage.get<Player[]>('players') ?? []
            const username = players1.find(player => player.cookie === cookie)?.username

            let reaction = ''

            switch (payload) {
              case 'nerdy':
                reaction = 'feels nerdy 🥸'
                break
              case 'hugs':
                reaction = 'loves you all 🤗'
                break
              case 'thinking':
                reaction = 'is thinking really hard 🤔'
                break
              case 'hello':
                reaction = 'says hello 🙋🏻‍♂️'
                break
              case 'party':
                reaction = 'is celebrating itself 🥳'
                break
              case 'looking':
                reaction = 'is watching you 👀'
                break
              case 'gotcha':
                reaction = 'feels like the boss 💪🏻'
                break
              case 'swag':
                reaction = 'has the swag 🤙🏻'
                break
            }

            
            boardHistory?.push({ type: HistorySliceType.QUICK_REACTION, relatedTo: username ?? 'no value?', message: reaction })
            this.broadcast({ action: 'quickReaction', payload: { relatedTo: username, message: reaction } })
            break
          case 'flipCard':
            let deck = await this.state.storage.get<TrmCard[]>('deck') ?? []

            deck.forEach(card => {
              if (card.id === payload) {
                card.clicked = true
              }
            })

            const clickedCards = deck.filter(card => card.clicked)

            if (clickedCards.length <= 2) { this.broadcast({ action: 'flipCard', payload }) }

            let players = await this.state.storage.get<Player[]>('players') ?? []

            if (clickedCards.length === 2) {
              setTimeout(async () => {
                let isTurnOf = await this.state.storage.get<string>('isTurnOf')

                const playerToAdjust = players.find(player => player.username === isTurnOf)

                if (clickedCards[0].imageUrl === clickedCards[1].imageUrl) {
                  

                  // TODO: throw error
                  if (!playerToAdjust) {
                    console.error('Not possible?!')
                    return
                  }

                  playerToAdjust.matchedPairs = playerToAdjust.matchedPairs + 1
                  boardHistory?.push({ type: HistorySliceType.PAIR_FOUND, relatedTo: playerToAdjust.username ?? 'no value?' })
                  this.broadcast({ action: 'pairFound', payload: { chipsToDeactivate: [clickedCards[0].id, clickedCards[1].id], relatedTo: playerToAdjust.username, matchedPairs: playerToAdjust.matchedPairs }})

                  clickedCards[0].active = false
                  clickedCards[1].active = false

                  const pairsLeft = deck.find(card => card.active)
                  
                  if (pairsLeft === undefined) {
                    const { roundsToPlay, currentRound } = boardStats

                    if (currentRound < roundsToPlay) {
                      setTimeout(async () => {
                        boardHistory?.push({ type: HistorySliceType.ROUND_OVER, relatedTo: 'syslog', message: currentRound.toString() })

                        await this.state.storage.put('boardHistory', boardHistory)

                        this.broadcast({ action: 'roundOver' })
                      }, 2000)

                      setTimeout(async () => {
                        boardStats.currentRound = boardStats.currentRound + 1
                        await this.state.storage.put('boardStats', boardHistory)

                        boardHistory?.push({ type: HistorySliceType.ROUND_STARTED, relatedTo: 'syslog', message: boardStats.currentRound.toString() })
                        await this.state.storage.put('boardHistory', boardHistory)
                        
                        const chipSet =  shuffle(createChipSet(PAIRS))
                        await this.state.storage.put('deck', chipSet)

                        this.broadcast({ action: 'roundStarted', payload: { currentRound: boardStats.currentRound, chipSet }})
                      }, 4000)

                      setTimeout(async () => {
                        const currentPlayersIndex = players.findIndex(player => player.username === isTurnOf)

                        try {
                          isTurnOf = players[currentPlayersIndex + 1].username
                        } catch(e) {
                          isTurnOf = players[0].username
                        }

                        await this.state.storage.put('isTurnOf', isTurnOf)

                        boardHistory?.push({ type: HistorySliceType.IS_TURN_OF, relatedTo: isTurnOf ?? 'no value?' })
                        await this.state.storage.put('boardHistory', boardHistory)

                        this.broadcast({ action: 'isTurnOf', payload: isTurnOf })
                      }, 6000)

                    } else {
                      const winner = players.reduce((previousPlayer, currentPlayer) => {
                        if (previousPlayer.matchedPairs > currentPlayer.matchedPairs) {
                          return previousPlayer
                        } else {
                          return currentPlayer
                        }
                      })
  
                      const { cookie } = winner
                      const serverSocket = this.connections.find(connection => connection.cookie === cookie)?.server
                      
                      boardHistory?.push({ type: HistorySliceType.ROUNDS_TO_PLAY_OVER, relatedTo: 'syslog' })

                      setTimeout(async () => {
                        boardHistory?.push({ type: HistorySliceType.OVERALL_RESULT, relatedTo: 'syslog' })
                        await this.state.storage.put('boardHistory', boardHistory)
                        
                        boardStats.currentState = 'ableToRestart'
                        await this.state.storage.put('boardStats', boardStats)

                        this.broadcast({ action: 'youLost', payload: boardStats.currentState }, cookie!)
                        serverSocket?.send(JSON.stringify({ action: 'youWon', payload: boardStats.currentState }))
                      }, 2000)
                    }
                  }
                } else {
                  const currentPlayersIndex = players.findIndex(player => player.username === isTurnOf)

                  if (!playerToAdjust) return

                  const totalPlayersRam = playerToAdjust.matchedPairs * 1000 - playerToAdjust.incorrectMatches * 100

                  if (totalPlayersRam > 0) {
                    playerToAdjust.incorrectMatches = playerToAdjust.incorrectMatches + 1
                    await this.state.storage.put('players', players)

                    boardHistory?.push({ type: HistorySliceType.NO_MATCH_WITH_WITHDRAW, relatedTo: playerToAdjust.username ?? 'no value?' })
                    await this.state.storage.put('boardHistory', boardHistory)

                    this.broadcast({ action: 'noMatchWithWithdraw', payload: { relatedTo: playerToAdjust.username, incorrectMatches: playerToAdjust.incorrectMatches }})
                  } else {
                    boardHistory?.push({ type: HistorySliceType.NO_MATCH_WITHOUT_WITHDRAW, relatedTo: playerToAdjust.username ?? 'no value?' })
                    await this.state.storage.put('boardHistory', boardHistory)
  
                    this.broadcast({ action: 'noMatchWithoutWithdraw', payload: { relatedTo: playerToAdjust.username }})
                  }
                  
                  try {
                    isTurnOf = players[currentPlayersIndex + 1].username
                  } catch(e) {
                    isTurnOf = players[0].username
                  }

                  boardHistory?.push({ type: HistorySliceType.IS_TURN_OF, relatedTo: isTurnOf ?? 'no value?' })
                  await this.state.storage.put('boardHistory', boardHistory)

                  this.broadcast({ action: 'isTurnOf', payload: isTurnOf })
                }

                deck.forEach(card => card.clicked = false)

                await this.state.storage.put('deck', deck)
                await this.state.storage.put('players', players)
                await this.state.storage.put('isTurnOf', isTurnOf)
              }, 2000)
            }

            await this.state.storage.put('boardHistory', boardHistory)
            await this.state.storage.put('boardStats', boardStats)
            await this.state.storage.put('deck', deck)
            break;
          case 'restartBoard':
            const refreshedDeck = shuffle(createChipSet(PAIRS))
            await this.state.storage.put('deck', refreshedDeck)

            let playersCurrent = await this.state.storage.get<Player[]>('players') ?? []
            playersCurrent = playersCurrent.map(player => ({
              username: player.username,
              matchedPairs: 0,
              incorrectMatches: 0
            }))
            await this.state.storage.put('players', playersCurrent)

            let boardStatsRestart = await this.state.storage.get<BoardStats>('boardStats') ?? { currentRound: 0, currentState: 'poweredOff', roundsToPlay: 0 }
            boardStatsRestart.currentRound = 0
            boardStatsRestart.currentState = 'poweredOff'
            await this.state.storage.put('boardStats', boardStatsRestart)

            this.broadcast({ action: 'restartBoard', payload: { deck: refreshedDeck, players: playersCurrent, boardStats: boardStatsRestart }})

            setTimeout(async () => {
              let isTurnOfRestart = await this.state.storage.get<string>('isTurnOf')
              let playersAfterRestart = await this.state.storage.get<Player[]>('players') ?? []

              if (!isTurnOfRestart) return

              const currentPlayersIndex = playersAfterRestart.findIndex(player => player.username === isTurnOfRestart)

              try {
                isTurnOfRestart = playersAfterRestart[currentPlayersIndex + 1].username
              } catch(e) {
                isTurnOfRestart = playersAfterRestart[0].username
              }

              await this.state.storage.put('isTurnOf', isTurnOfRestart)

              boardHistory?.push({ type: HistorySliceType.IS_TURN_OF, relatedTo: isTurnOfRestart ?? 'no value?' })
              await this.state.storage.put('boardHistory', boardHistory)

              this.broadcast({ action: 'isTurnOf', payload: isTurnOfRestart })
            }, 1500)

            break
        }
        
      } catch (err) {
        // Report any exceptions directly back to the client. As with our handleErrors() this
        // probably isn't what you'd want to do in production, but it's convenient when testing.
        webSocket.send(JSON.stringify({error: err.stack}));
      }
    })

    webSocket.addEventListener('close', async () => {
      const cookie = this.connections.find(connection => connection.server === webSocket)?.cookie

      let boardStatsToAdjust = await this.state.storage.get<BoardStats>('boardStats') ?? { currentRound: 0, currentState: 'poweredOff', roundsToPlay: 0 }
      boardStatsToAdjust.roundsToPlay = boardStatsToAdjust.roundsToPlay - 1
      await this.state.storage.put('boardStats', boardStatsToAdjust)

      let players = await this.state.storage.get<Player[]>('players') ?? []
      const boardHistory = await this.state.storage.get<HistorySlice[]>('boardHistory')
      const playerToRemove = { ...players.find(player => player.cookie === cookie) }

      if (!playerToRemove) {
        console.log('Something went wrong')
        return
      }
      
      players = players.filter(player => player.cookie !== cookie)
      
      if (!players.length) {
        await this.state.storage.deleteAll()
        console.log('Board to be destroyed')
        return
      }

      await this.state.storage.put('players', players)

      this.connections = this.connections.filter(connection => connection.server !== webSocket)
      
      boardHistory?.push({ type: HistorySliceType.LEFT, relatedTo: playerToRemove.username ?? 'no value?' })
      await this.state.storage.put('boardHistory', boardHistory)

      this.broadcast({ action: 'playerLeft', payload: { relatedTo: playerToRemove.username, boardStats: boardStatsToAdjust }})

      let isTurnOfPlayerThatLeft = await this.state.storage.get<string>('isTurnOf')

      if (!isTurnOfPlayerThatLeft) return

      if (playerToRemove.username === isTurnOfPlayerThatLeft) {
        const currentPlayersIndex = players.findIndex(player => player.username === isTurnOfPlayerThatLeft)

        try {
          isTurnOfPlayerThatLeft = players[currentPlayersIndex + 1].username
        } catch(e) {
          isTurnOfPlayerThatLeft = players[0].username
        }

        await this.state.storage.put('isTurnOf', isTurnOfPlayerThatLeft)

        boardHistory?.push({ type: HistorySliceType.IS_TURN_OF, relatedTo: isTurnOfPlayerThatLeft ?? 'no value?' })
        await this.state.storage.put('boardHistory', boardHistory)

        this.broadcast({ action: 'isTurnOf', payload: isTurnOfPlayerThatLeft })
      }
     })
  }
}