import { ArrowCircleLeftIcon, ArrowRightIcon, ClipboardIcon, LockClosedIcon, LockOpenIcon, LogoutIcon, UsersIcon } from "@heroicons/react/outline"
import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/cloudflare"
import { Form, useLoaderData, useParams } from "@remix-run/react"
import { ReactNode, useEffect, useRef, useState } from "react"
import Modal from "~/components/Modal"
import PlayerCard from "~/components/PlayerCard"
import TrmCard from "~/components/TrmCard"
import { motion } from 'framer-motion'
import { constructUrlForDo } from "~/utils"

export const loader: LoaderFunction = async ({ params, context, request }) => {
    const { ramId } = params
    const { env } = context

    const response = await fetch(constructUrlForDo(env.DO_HOST, `rams/${ramId}`))

    let data: object = await response.json()

    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie);

    if (session && session.has('username')) {
        const response = await fetch(constructUrlForDo(env.DO_HOST, `rams/${ramId}/join`), { 
            body: JSON.stringify({
                username: session.get('username'),
                cookie
            }),
            method: 'POST'
        })

        const { isTurnOf, players } = await response.json()
        data = { ...data, hasSession: true, players, isTurnOf }
    } else {
        data = { ...data, hasSession: false }
    }
    
    return json({ 
        ...data,
        doHost: env.DO_HOST
    })
}

export const action: ActionFunction = async({ params, context, request }) => {
    const { ramId } = params

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
    imageUrl: any
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

export default function Ram() {
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
    const { isPrivate, deck, hasSession, doHost, allowedPlayersInTotal } = data

    const [cards, setCards] = useState<TrmCard[]>(deck ?? [])
    const [players, setPlayers] = useState<Player[]>(data.players ?? [])
    const [isTurnOf, setIsTurnOf] = useState<string | undefined>(data.isTurnOf)
    const [showYouWonModal, setShowYouWonModal] = useState(false)
    const [showYouLostModal, setShowYouLostModal] = useState(false)
    const [showEnterUsernameModal, setShowEnterUsernameModal] = useState(!hasSession)

    if (hasSession) {
        useEffect(() => {
            socket.current = new WebSocket(constructUrlForDo(doHost, `websocket/${ramId}?player=${document.cookie}`, true))
    
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
                            let players = prevPlayers.map(player => ({
                                ...player,
                                matchedPairs: player.username === payload ? player.matchedPairs + 1 : player.matchedPairs
                            }))
    
                            players.push({ matchedPairs, username, itsMe })
    
                            return players
                        })
    
                        break
                }
    
            }
        }, [])
    }
    

    const flipCard = id => socket.current?.send(JSON.stringify({ action: 'flipCard', payload: id }))

    const shareBoard = async () => {
        try {
            await navigator.share({
                title: 'RAMory',
                text: 'How good is your memory?',
                url: window.location.href
            })
          } catch(err) {
            console.log(err)
          }
    }

    const isMyTurn = isTurnOf === players.find(player => player.itsMe)?.username

    return (
        <div className="flex flex-col gap-10 justify-between h-full">
            <div className="flex flex-col gap-5 md:flex-row md:justify-between md:items-center">
                <h1 className="font-bold text-6xl">RAMory</h1>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-5 h-full">
                { cards.map(({ id, clicked, imageUrl, active }) => (
                    <TrmCard 
                        key={id}
                        id={id}
                        clicked={clicked}
                        isMyTurn={isMyTurn}
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
            <div className="flex flex-col md:flex-row gap-5 items-start justify-between">
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
                        onClick={() => shareBoard()}
                        className="text-pink-500 px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 rounded-xl flex flex-row gap-2 items-center"
                    ><ClipboardIcon className="h-4"/>Copy RAM and send to friend</button>
                    <Form method="post" action="/leave-ram" className="flex text-gray-400 flex-row gap-2 items-center hover:cursor-pointer">
                        <input hidden value={ramId} name="ramToLeave" readOnly />
                        <button className="text-xs rounded-lg" type="submit">Leave</button>
                        <ArrowRightIcon className="h-4"></ArrowRightIcon>
                    </Form>
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