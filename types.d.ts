interface Player {
    matchedPairs: number
    websocket?: WebSocket
    username: string
    cookie?: string | null
    itsMe: boolean
}
  
interface TrmCard {
    id: string
    clicked: boolean
    imageUrl: string
    active: boolean
}

interface Reaction {
    label: string
    value: string
}