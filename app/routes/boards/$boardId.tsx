import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/cloudflare"
import { Form, useLoaderData, useParams } from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import TrmCard from "~/components/Chip"
import { useSubmit } from "@remix-run/react";
import { constructUrlForDo } from "~/utils"
import QuickReactions from "~/components/QuickReactions"
import Chip from "~/components/Chip";
import RamCard from "~/components/RamCard";
import Modal from "~/components/Modal";
import ConsoleInput from "~/components/ConsoleInput";
import ConsoleHistory from "~/components/ConsoleHistory";

export const loader: LoaderFunction = async ({ params, context, request }) => {
    const { boardId } = params
    const { env } = context

    const response = await fetch(constructUrlForDo(env.DO_HOST, `boards/${boardId}`))

    let data: object = await response.json()

    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie);

    if (session && session.has('username')) {
        const response = await fetch(constructUrlForDo(env.DO_HOST, `boards/${boardId}/join`), { 
            body: JSON.stringify({
                username: session.get('username'),
                cookie
            }),
            method: 'POST'
        })

        const { isTurnOf, players, boardHistory, boardStats } = await response.json()
        data = { ...data, hasSession: true, players, isTurnOf, boardHistory, boardStats }
    } else {
        data = { ...data, hasSession: false }
    }

    console.log(data)
    
    return json({ 
        ...data,
        doHost: env.DO_HOST
    })
}

export const action: ActionFunction = async({ params, context, request }) => {
    const { boardId } = params

    const form = await request.formData();
    const username = form.get("username");

    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    session.set('username', username)

    return redirect(`/boards/${boardId}`, {
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

export default function Board() {
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
        },
        {
            label: '🙋🏻‍♂️',
            value: 'hello'
        },
        ,
        {
            label: '🤙🏻',
            value: 'swag'
        },
        {
            label: '👀',
            value: 'looking'
        },
        {
            label: '💪🏻',
            value: 'gotcha'
        }
    ]

    const socket = useRef<WebSocket>()
    const consoleInputRef = useRef<HTMLInputElement>(null)

    const { boardId } = useParams()
    const submit = useSubmit();

    const data = useLoaderData()
    const { deck, hasSession, doHost } = data

    const [cards, setCards] = useState<TrmCard[]>(deck ?? [])
    const [players, setPlayers] = useState<Player[]>(data.players ?? [])
    const [isTurnOf, setIsTurnOf] = useState<string | undefined>(data.isTurnOf)
    const [showEnterUsernameModal, setShowEnterUsernameModal] = useState(!hasSession)
    const [boardHistory, setBoardHistory] = useState<any[]>(data.boardHistory ?? [])
    const [boardStats, setBoardStats] = useState<any>(data.boardStats)

    useEffect(() => {
        if (consoleInputRef.current) {
            consoleInputRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [boardHistory])

    useEffect(() => {
        if (hasSession) {
            if (process.env.NODE_ENV === 'production') {
                window.addEventListener("beforeunload", (ev) => { 
                    ev.preventDefault();
        
                    // TODO: throw error
                    if (!boardId) { return }
        
                    const formData = new FormData()
                    formData.append('ramToLeave', boardId)
        
                    submit(formData, { method: "post", action: "/leave-ram" });
                    return ev.returnValue = 'Sure?'
                });
            }

            socket.current = new WebSocket(constructUrlForDo(doHost, `websocket/${boardId}?player=${document.cookie}`, true))

            socket.current.onmessage = ({ data }) => {
                const { action, payload } = JSON.parse(data)
                
                switch (action) {
                    case 'roundStarted':
                        const { currentRound, chipSet } = payload

                        setCards(chipSet)
                        setBoardStats(prevStats => ({ ...prevStats, currentRound }))
                        setBoardHistory(history => [...history, { type: '', from: 'syslog', message: `Round ${boardStats.currentRound}/${boardStats.roundsToPlay} started, good luck!`}])

                        break
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
    
                    case 'quickReaction':
                        setBoardHistory(history => [
                            ...history, 
                            { type: '', from: payload.relatedTo, message: payload.message }
                        ])
                        break
                    case 'pairFound':
                        const { chipsToDeactivate, relatedTo } = payload

                        setCards(prevCards => {
                            let cards = prevCards.map(card => ({
                                ...card,
                                clicked: false,
                                active: card.active ? !chipsToDeactivate.includes(card.id) : card.active
                            }))
    
                            return cards
                        })

                        setBoardHistory(prevHistory => {
                            let history = prevHistory.map(historySlice => ({ ...historySlice }))
                            
                            history.push({ type: '', from: 'syslog', message: `${relatedTo} found a pair!`})

                            return history
                        })

                        break
    
                    case 'isTurnOf':
                        setIsTurnOf(payload)
                        setBoardHistory(history => [...history, { type: '', from: 'syslog', message: `it's your turn ${payload}`}])
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
                        setBoardStats(prevStats => ({ ...prevStats, currentState: payload }))
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: '', from: 'syslog', message: 'You won!'}
                        ])
                        break
    
                    case 'youLost':
                        setBoardStats(prevStats => ({ ...prevStats, currentState: payload }))
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: '', from: 'syslog', message: 'You lost !'}
                        ])
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

                        setBoardHistory(history => [
                            ...history, 
                            { type: '', from: 'syslog', message: `${username} joined`}
                        ])
    
                        break

                    case 'playerLeft':
                        setPlayers(prevPlayers => {
                            let players = prevPlayers.filter(player => player.username !== payload)
    
                            return players
                        })

                        setBoardHistory(history => [
                            ...history, 
                            { type: '', from: 'syslog', message: `${payload} left`}
                        ])
    
                        break
                }
    
            }
        }
    }, [])

    const flipCard = id => socket.current?.send(JSON.stringify({ action: 'flipCard', payload: id }))

    const sendQuickReaction = (payload: string) => {
        socket.current?.send(JSON.stringify({ action: 'quickReaction', payload }))
    }

    const restartBoard = () => {
        if (boardStats.currentState === 'ableToRestart') {
            socket.current?.send(JSON.stringify({ action: 'restartBoard' }))
        }
    }

    const isMyTurn = isTurnOf === players.find(player => player.itsMe)?.username

    const chipSet = []

    for (let i = 0; i < 24; i++) {
        chipSet.push(<img src="/silicon.png" className="object-scale-down"/>)
    }

    return (
        <div className="p-8 bg-gray-800 gap-8">
            <div className="flex flex-col gap-8 lg:max-w-[1024px] mx-auto my-0">
                <div className="flex flex-col gap-8">
                    <div>
                        <ConsoleHistory boardHistory={boardHistory} />
                        <div ref={consoleInputRef}>
                            <ConsoleInput currentHistorySlice={boardHistory[boardHistory.length - 1]} />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 grid-rows-6 md:grid-cols-6 md:grid-rows-4 gap-4 justify-start">
                    { cards.map(({ id, clicked, imageUrl, active }) => (
                        <Chip 
                            key={id}
                            id={id}
                            clicked={clicked}
                            isMyTurn={isMyTurn}
                            imageUrl={imageUrl}
                            active={active}
                            chipClicked={flipCard}
                        />
                    )) }
                    </div>
                    <QuickReactions reactions={reactions} sendQuickReaction={sendQuickReaction} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                { players.map(({ username, itsMe, matchedPairs }) => (
                    <RamCard key={username} itsMe={itsMe} username={username} ramCollected={matchedPairs} />
                ))}
                </div>
                <div className="flex flex-col gap-2">
                    <Form method="post" action="/leave-ram" className="shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-lg border-2 border-black bg-gray-300 px-2 py-1 w-fit hover:cursor-pointer">
                        <input hidden value={boardId} name="ramToLeave" readOnly />
                        <button className="font-semibold" type="submit">🌱 leave</button>
                    </Form>
                    <button 
                        onClick={() => restartBoard()} 
                        disabled={boardStats.currentState !== 'ableToRestart'}
                        className={`${boardStats.currentState === 'ableToRestart' ? 'text-black hover:cursor-pointer border-black' : 'text-gray-300 hover:cursor-not-allowed border-gray-300'} font-semibold shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-lg border-2 bg-gray-100 px-2 py-1 w-fit`}
                    >🔁 restart board</button>
                </div>
            </div>
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