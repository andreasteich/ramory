import { useParams } from "@remix-run/react"
import { useState } from "react"
import { Link } from "react-router-dom"
import PlayerCard from "~/components/PlayerCard"
import TrmCard from "~/components/TrmCard"

type TrmCard = {
    id: string;
    clicked: boolean;
    imageUrl: string;
}

type PlayerStats = {
    username: string
    matchedPairs: number
}

const INITIAL_CARD_DECK: TrmCard[] = [
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



const INITIAL_STATS_PLAYER_1: PlayerStats = {
    username: 'Andifined',
    matchedPairs: 0
}

const INITIAL_STATS_PLAYER_2: PlayerStats = {
    username: '---',
    matchedPairs: 0
}

export default function Room() {
    const { ramId } = useParams()

    const [cards, setCards] = useState(INITIAL_CARD_DECK)
    const [statsPlayer1, setStatsPlayer1] = useState(INITIAL_STATS_PLAYER_1)
    const [statsPlayer2, setStatsPlayer2] = useState(INITIAL_STATS_PLAYER_2)
    const [isMyTurn, setIsMyTurn] = useState(true)

    const isPublic = true

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
        <div className="flex flex-col gap-5 justify-evenly h-full">
            <Link to="/">
                <h1 className="font-bold text-4xl">ONLYRams</h1>
            </Link>
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
                <div className="flex flex-col gap">
                    <div>
                        { isPublic ? 
                            <p className="text-red-500 rounded-lg">Public</p> : 
                            <p className="text-green-500 rounded-lg">Private</p>
                        }
                    </div>
                    <h1 className="text-pink-500 text-4xl">RAM {ramId}</h1>
                </div>
                <PlayerCard isMyTurn={isMyTurn} myself={true} username={statsPlayer1.username} matchedPairs={statsPlayer1.matchedPairs} />
                <PlayerCard isMyTurn={!isMyTurn} username={statsPlayer2.username} matchedPairs={statsPlayer2.matchedPairs} />
            </div>
        </div>
    )
}