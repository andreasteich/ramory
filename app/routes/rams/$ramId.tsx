import { json, LoaderFunction } from "@remix-run/cloudflare"
import { useLoaderData, useParams, useSubmit } from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import Modal from "~/components/Modal"
import PlayerCard from "~/components/PlayerCard"
import TrmCard from "~/components/TrmCard"

export const loader: LoaderFunction = async ({ params, context, request }) => {
    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie);

    const { ramId } = params
    const response = await fetch(`http://localhost:8787/rams/${ramId}`, { 
        body: JSON.stringify({
            username: session.get('username'),
            cookie
        }),
        method: 'POST'
    })

    const data = await response.json()
    console.log(data)

    return json(data)
}

type TrmCard = {
    id: string
    clicked: boolean
    imageUrl: string
    active: boolean
}

type Player = {
    matchedPairs: number
    username: string
    itsMe: boolean
  }

export default function Room() {
    const socket = useRef<WebSocket>()

    const { ramId } = useParams()
    const submit = useSubmit()

    const data = useLoaderData()
    const { isPrivate, topic, deck } = data

    const [cards, setCards] = useState<TrmCard[]>(deck ?? [])
    const [players, setPlayers] = useState<Player[]>(data.players)
    const [isTurnOf, setIsTurnOf] = useState<string | undefined>(data.isTurnOf)
    const [showYouWonModal, setShowYouWonModal] = useState(false)
    const [showYouLostModal, setShowYouLostModal] = useState(false)

    useEffect(() => {
        socket.current = new WebSocket(`ws://localhost:8787/websocket/${ramId}`);

        socket.current.onmessage = ({ data }) => {
            const { action, payload } = JSON.parse(data)
            
            switch (action) {
                case 'flipCard':
                    setCards(prevCards => {
                        const cards = [...prevCards]

                        cards.forEach(card => {
                            if (card.id === payload) {
                                card.clicked = !card.clicked
                            }
                        })

                        return cards
                    })
                    break

                case 'pairFound':
                    setCards(prevCards => {
                        let cards = prevCards.map(card => ({
                            ...card,
                            clicked: false,
                            active: card.active ? !payload.includes(card.id) : card.active
                        }))

                        return cards
                    })
                    break

                case 'isTurnOf':
                    setIsTurnOf(payload)
                    break

                case 'incrementPairsOfPlayer':
                    setPlayers(prevPlayers => prevPlayers.map(player => ({
                        ...player,
                        matchedPairs: player.username === payload ? payload : player.matchedPairs
                    })))
                    break

                case 'youWon':
                    setShowYouWonModal(true)
                    break

                case 'youLost':
                    setShowYouLostModal(true)
                    break
                
                case 'noMatch':
                    setCards(prevCards => prevCards.map(card => ({ ...card, clicked: false })))
                    break
            }

        }
    }, [])

    const flipCard = id => {
        socket.current?.send(JSON.stringify({ action: 'flipCard', payload: id }))
    }

    return (
        <div className="flex flex-col gap-5 justify-between h-full">
            <div className="flex flex-row justify-between items-center">
                <div className="flex flex-row gap-2">
                    <h1 className="font-bold text-6xl">RAMory | {topic}</h1>
                </div>
                <Link to="/rams" className="px-4 py-2 border text-pink-500 hover:bg-gray-100 rounded-lg">Leave</Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-5">
                { cards.map(({ id, clicked, imageUrl, active }) => (
                    <TrmCard 
                        key={id}
                        id={id}
                        clicked={clicked} 
                        imageUrl={imageUrl}
                        active={active}
                        cardClicked={flipCard}
                    />
                )) }
            </div>
            <div className="grid grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap">
                        { isPrivate ? 
                            <p className="text-green-500 rounded-lg">Private</p> :
                            <p className="text-red-500 rounded-lg">Public</p>
                        }
                        <h1 className="text-pink-500 text-4xl">RAM {ramId}</h1>
                    </div>
                    <div>
                        <button 
                            className="text-sm border rounded-lg text-gray-500 px-4 py-2 hover:border-pink-500 hover:text-pink-500"
                        >Copy RAM and send to friend</button>
                    </div>
                </div>
                { players.map(({ username, itsMe, matchedPairs }) => (
                    <PlayerCard key={username} active={isTurnOf === username} myself={itsMe} username={username} matchedPairs={matchedPairs} />
                ))}
                </div>
            { showYouWonModal && (
                <Modal closeModal={() => setShowYouWonModal(true)}>
                    <h1>Nice you won!</h1>
                </Modal>
            )}
            { showYouLostModal && (
                <Modal closeModal={() => setShowYouLostModal(true)}>
                    <h1>Looser!</h1>
                </Modal>
            )}
        </div>
    )
}