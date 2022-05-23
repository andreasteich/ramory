import { ArrowCircleLeftIcon, ArrowRightIcon, ClipboardIcon, LockClosedIcon, LockOpenIcon, LogoutIcon, UsersIcon } from "@heroicons/react/outline"
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/cloudflare"
import { Form, useLoaderData, useParams } from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import Modal from "~/components/Modal"
import PlayerCard from "~/components/PlayerCard"
import TrmCard from "~/components/TrmCard"
import { motion } from 'framer-motion'

export const loader: LoaderFunction = async ({ params, context, request }) => {
    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie);

    const { ramId } = params

    const { env } = context

    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'

    const response = await fetch(`${protocol}://${env.HOST}/rams/${ramId}`, { 
        body: JSON.stringify({
            username: session.get('username'),
            cookie
        }),
        method: 'POST'
    })

    console.log(session, cookie)
    const data: object = await response.json()

    return json({ 
        ...data,
        hasSession: !!cookie,
        deployUrl: env.HOST
    })
}

export const action: ActionFunction = async({ params, context, request }) => {
    const { ramId } = params
    // TODO: refactor into util, same logic from landing-page

    const form = await request.formData();
    const username = form.get("username");

    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    session.set('username', username)

    return redirect(`/rams/${ramId}`, {
        headers: { "Set-Cookie": await context.sessionStorage.commitSession(session) }
    });
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

type Reaction = {
    label: string
    value: string
}

export default function Room() {
    const reactions: Reaction[] = [
        {
            label: '🤔',
            value: 'thinking'
        },
        {
            label: '🥳',
            value: 'party'
        },
        {
            label: '🥸',
            value: 'nerdy'
        },
        {
            label: '🤗',
            value: 'hugs'
        }
    ]

    const socket = useRef<WebSocket>()

    const { ramId } = useParams()

    const data = useLoaderData()
    const { isPrivate, deck, hasSession, deployUrl, allowedPlayersInTotal } = data

    const [cards, setCards] = useState<TrmCard[]>(deck ?? [])
    const [players, setPlayers] = useState<Player[]>(data.players)
    const [isTurnOf, setIsTurnOf] = useState<string | undefined>(data.isTurnOf)
    const [showYouWonModal, setShowYouWonModal] = useState(false)
    const [showYouLostModal, setShowYouLostModal] = useState(false)
    const [showEnterUsernameModal, setShowEnterUsernameModal] = useState(!hasSession)

    useEffect(() => {
        const protocol = process.env.NODE_ENV === 'production' ? 'wss' : 'ws'
        socket.current = new WebSocket(`${protocol}://${deployUrl}/websocket/${ramId}`)

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
                    setPlayers(prevPlayers => {
                        let cards = prevPlayers.map(player => ({
                            ...player,
                            matchedPairs: player.username === payload ? player.matchedPairs + 1 : player.matchedPairs
                        }))

                        return cards
                    })
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
                
                case 'playerJoined':
                    const { username, matchedPairs, itsMe } = payload

                    setPlayers(prevPlayers => {
                        let cards = prevPlayers.map(player => ({
                            ...player,
                            matchedPairs: player.username === payload ? player.matchedPairs + 1 : player.matchedPairs
                        }))

                        cards.push({ matchedPairs, username, itsMe })

                        return cards
                    })

                    break
            }

        }
    }, [])

    const flipCard = id => {
        socket.current?.send(JSON.stringify({ action: 'flipCard', payload: id }))
    }

    return (
        <div className="flex flex-col gap-10 justify-between h-full">
            <div className="flex flex-row justify-between items-center">
                <h1 className="font-bold text-6xl">RAMory</h1>
                <div className="flex flex-row gap-5 items-center">
                { isPrivate ? 
                    <div className="flex flex-row border px-4 py-2 rounded-xl gap-2 text-green-500 border-green-500 items-center">
                        <LockClosedIcon className="h-4 w-4 text-green-400"/>
                        <p className="text-sm">Private</p>
                    </div> :
                    <div className="flex flex-row border px-4 py-2 rounded-xl gap-2 text-red-500 items-center">
                        <LockOpenIcon className="h-4"/>
                        <p>Public</p>
                    </div>
                }
                <Form method="post" action="/leave-ram" className="flex flex-row gap-2 items-center hover:cursor-pointer">
                    <input hidden value={ramId} name="ramToLeave" readOnly />
                    <button className="text-sm rounded-lg" type="submit">Leave</button>
                    <ArrowRightIcon className="h-4"></ArrowRightIcon>
                </Form>
                </div>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-5 h-full">
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
            <div className="flex flex-col gap-2">
                <div className="flex flex-row gap-2 items-center">
                    <UsersIcon className="h-4" />
                    <p className="text-sm font-bold">{players.length} / {allowedPlayersInTotal}</p>
                </div>
                <div className="flex flex-col gap">
                { players.map(({ username, itsMe, matchedPairs }) => (
                    <PlayerCard key={username} active={isTurnOf === username} myself={itsMe} username={username} matchedPairs={matchedPairs} />
                ))}
                </div>
            </div>
            <div className="flex flex-row gap-5 items-center justify-between">
                <div className="flex flex-row gap-2 bg-gray-300 px-2 py-1 rounded-full">
                { reactions.map(({ label, value }) => (
                    <motion.p
                        key={value}
                        className="hover:cursor-pointer"
                        whileHover={{
                            scale: 1.2,
                            transition: { duration: 0.1 },
                        }}
                        whileTap={{ rotate: 360 }}
                    >{label}</motion.p>
                ))}
                </div>
                <div className="flex flex-row gap-5">
                    <button 
                        className="text-pink-500 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl flex flex-row gap-2 items-center"
                    ><ClipboardIcon className="h-4"/>Copy RAM and send to friend</button>
                </div>
                
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
            { showEnterUsernameModal && (
                <Modal closeModal={() => setShowEnterUsernameModal(true)} >
                    <h1>Enter username</h1>
                    <Form reloadDocument method="post" className="flex flex-col items-center gap-5">
                        <input type="text" placeholder="Enter username" name="username" className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        <button type="submit" className="py-2 w-full text-center bg-pink-500 hover:bg-pink-600 text-white text-2xl rounded-lg">Let's go!</button>
                    </Form>
                </Modal>
            )}
        </div>
    )
}