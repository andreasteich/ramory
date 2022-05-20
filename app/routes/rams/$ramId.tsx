import { json, LoaderFunction } from "@remix-run/cloudflare"
import { useLoaderData, useParams } from "@remix-run/react"
import { useState } from "react"
import { Link } from "react-router-dom"
import PlayerCard from "~/components/PlayerCard"
import TrmCard from "~/components/TrmCard"



type PlayerStats = {
    username: string
    matchedPairs: number
}

const INITIAL_STATS_PLAYER_1: PlayerStats = {
    username: 'Andifined',
    matchedPairs: 0
}

const INITIAL_STATS_PLAYER_2: PlayerStats = {
    username: '---',
    matchedPairs: 0
}

export const loader: LoaderFunction = async ({ params, context, request }) => {
    const { ramId } = params
    const response = await fetch(`http://localhost:8787/rams/${ramId}`)

    const data = await response.json()
    console.log(data)

    return json(data)
}

type TrmCard = {
    id: string
    clicked: boolean
    imageUrl: string
}

export default function Room() {
    const { ramId } = useParams()

    const { 
        isPrivate, 
        player1,
        player2,
        totalPairsMatched, 
        topic,
        deck
    } = useLoaderData()

    const [cards, setCards] = useState<TrmCard[]>(deck ?? [])
    const [statsPlayer1, setStatsPlayer1] = useState({ username: player1.username, matchedPairs: player1.matchedPairs })
    const [statsPlayer2, setStatsPlayer2] = useState({ username: player2.username ?? '---', matchedPairs: player2.matchedPairs ?? 0 })
    const [isMyTurn, setIsMyTurn] = useState(true)

    const handleClick = (cardId: string) => {
        cards.forEach(card => {
            if (card.id === cardId) {
                card.clicked = !card.clicked
            }
        })

        const clickedCards = cards.filter(card => card.clicked)

        if (clickedCards.length >= 2) {
            if (clickedCards[0].imageUrl === clickedCards[1].imageUrl) {
                if (isMyTurn) {
                    setStatsPlayer1({
                        ...statsPlayer1,
                        matchedPairs: statsPlayer1.matchedPairs + 1
                    })
                } else {
                    setStatsPlayer2({
                        ...statsPlayer2,
                        matchedPairs: statsPlayer2.matchedPairs + 1
                    })
                }
                
            }

            setTimeout(() => {
                cards.forEach(card => card.clicked = false)
                setCards([...cards])
                setIsMyTurn(!isMyTurn)
            }, 1000)
        }

        setCards([...cards])
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
                { cards.map(({ id, clicked, imageUrl }) => (
                    <TrmCard 
                        id={id} 
                        key={id} 
                        clicked={clicked} 
                        imageUrl={imageUrl} 
                        cardClicked={handleClick} 
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
                <PlayerCard isMyTurn={isMyTurn} myself={true} username={statsPlayer1.username} matchedPairs={statsPlayer1.matchedPairs} totalPairsMatched={totalPairsMatched} />
                <PlayerCard isMyTurn={!isMyTurn} username={statsPlayer2.username} matchedPairs={statsPlayer2.matchedPairs} totalPairsMatched={totalPairsMatched} />
            </div>
        </div>
    )
}