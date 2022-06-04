import { ActionFunction, json, LoaderFunction, MetaFunction, redirect } from "@remix-run/cloudflare"
import { Form, Link, useLoaderData, useParams } from "@remix-run/react"
import { useEffect, useRef, useState } from "react"
import TrmCard from "~/components/Chip"
import { useSubmit } from "@remix-run/react";
import { constructUrlForDo } from "~/utils"
import QuickReactions from "~/components/QuickReactions"
import Chip from "~/components/Chip";
import RamCard from "~/components/RamCard";
import Modal from "~/components/Modal";
import BoardHistory from "~/components/BoardHistory";
import { DesktopComputerIcon } from '@heroicons/react/outline'

export const meta: MetaFunction = ({ params }) => ({
    charset: "utf-8",
    title: `RAMory 🎸 | board ${params.boardId}`,
    viewport: "width=device-width,initial-scale=1",
  });

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
    incorrectMatches: number
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
        if (hasSession) {
            socket.current = new WebSocket(constructUrlForDo(doHost, `websocket/${boardId}?player=${document.cookie}`, true))

            socket.current.onmessage = ({ data }) => {
                const { action, payload } = JSON.parse(data)
                
                switch (action) {
                    case 'restartBoard':
                        console.log(payload)
                        setCards(payload.deck)
                        setPlayers(payload.players.map(player => ({
                            ...player,
                            itsMe: player.username === username
                        })))
                        setBoardStats(payload.boardStats)
                        setBoardHistory(history => [
                            ...history, 
                            { type: 'info', from: 'syslog', message: `Board restarted!` }
                        ])
                        break
                    case 'roundStarted':
                        const { currentRound, chipSet } = payload

                        setCards(chipSet)
                        setBoardStats(prevStats => ({ ...prevStats, currentRound }))
                        console.log('stats', boardStats)
                        setBoardHistory(history => [
                            ...history, 
                            { type: 'info', from: 'syslog', message: `Round ${boardStats.currentRound}/${boardStats.roundsToPlay} started, good luck!` }
                        ])

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
                            { type: 'quickReaction', from: payload.relatedTo, message: payload.message }
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

                        setPlayers(prevPlayers => {
                            let cards = prevPlayers.map(player => ({
                                ...player,
                                matchedPairs: player.username === payload.relatedTo ? payload.matchedPairs : player.matchedPairs
                            }))
    
                            return cards
                        })

                        setBoardHistory(prevHistory => {
                            let history = prevHistory.map(historySlice => ({ ...historySlice }))
                            
                            history.push({ type: 'pairFound', from: 'syslog', message: `${relatedTo} found a pair, try again ${relatedTo}!`})

                            return history
                        })

                        break
    
                    case 'isTurnOf':
                        console.log(players)
                        setIsTurnOf(payload)
                        setBoardHistory(history => [
                            ...history, 
                            { type: 'info', from: 'syslog', message: `it's your turn ${payload}` }
                        ])
                        break
    
                    case 'youWon':
                        setBoardStats(prevStats => ({ ...prevStats, currentState: payload }))
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: 'end', from: 'syslog', message: 'You won, click "restart board" to start again!'}
                        ])
                        break
    
                    case 'youLost':
                        setBoardStats(prevStats => ({ ...prevStats, currentState: payload }))
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: 'end', from: 'syslog', message: 'You lost, click "restart board" to start again!'}
                        ])
                        break
                    
                    case 'noMatchWithWithdraw':
                        setCards(prevCards => prevCards.map(card => ({ ...card, clicked: false })))
                        setPlayers(prevPlayers => {
                            let players = prevPlayers.map(player => ({
                                ...player,
                                incorrectMatches: player.username === payload.relatedTo ? payload.incorrectMatches : player.incorrectMatches
                            }))
    
                            return players
                        })
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: 'noMatch', from: 'syslog', message: `No match! -100mb for ${payload.relatedTo}`}
                        ])
                        break

                    case 'noMatchWithoutWithdraw':
                        setCards(prevCards => prevCards.map(card => ({ ...card, clicked: false })))
                        setBoardHistory(prevHistory => [
                            ...prevHistory,
                            { type: 'noMatch', from: 'syslog', message: `No match! Not able to withdraw RAM from ${payload.relatedTo}`}
                        ])
                        break
                    
                    case 'playerJoined':
                        const { username, matchedPairs, itsMe, incorrectMatches } = payload
    
                        setPlayers(prevPlayers => {
                            let players = prevPlayers.map(player => ({
                                ...player,
                                matchedPairs: player.username === payload ? player.matchedPairs + 1 : player.matchedPairs
                            }))
    
                            players.push({ matchedPairs, username, itsMe, incorrectMatches })
    
                            return players
                        })
                        console.log(payload.roundsToPlay)
                        setBoardStats(prevStats => ({ ...prevStats, roundsToPlay: payload.roundsToPlay }))

                        setBoardHistory(history => [
                            ...history, 
                            { type: 'info', from: 'syslog', message: `${username} joined`}
                        ])
    
                        break

                    case 'playerLeft':
                        setPlayers(prevPlayers => {
                            let players = prevPlayers.filter(player => player.username !== payload.relatedTo)
    
                            return players
                        })
                        setBoardStats(payload.boardStats)

                        setBoardHistory(history => [
                            ...history, 
                            { type: 'info', from: 'syslog', message: `${payload.relatedTo} left`}
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

    const leaveBoard = () => {
        socket.current?.close()
    }

    const chipSet = []

    for (let i = 0; i < 24; i++) {
        chipSet.push(<img src="/silicon.png" className="object-scale-down"/>)
    }

    const isMyTurn = isTurnOf === players.find(player => player.itsMe)?.username

    return (
        <div className="p-8 bg-gray-800">
            <div className="lg:max-w-[1024px] mx-auto my-0 flex flex-col gap-8 justify-between">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <BoardHistory boardHistory={boardHistory} />
                    <div className="lg:col-span-2 grid grid-cols-4 grid-rows-6 md:grid-cols-6 md:grid-rows-4 gap-4 h-fit">
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
                </div>
                <QuickReactions reactions={reactions} sendQuickReaction={sendQuickReaction} />
                <div className="flex flex-col gap-4">
                { players.map(({ username, itsMe, matchedPairs, incorrectMatches }) => (
                    <RamCard key={username} itsMe={itsMe} username={username} matchedPairs={matchedPairs} incorrectMatches={incorrectMatches} />
                ))}
                </div>
                <div className="flex flex-row gap-2">
                    <Link 
                        to="/"
                        onClick={() => leaveBoard()}
                        className="shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-lg border-2 border-black bg-gray-300 px-2 py-1 w-fit hover:cursor-pointer font-semibold text-sm"
                    >🌱 leave</Link>
                    <button 
                        onClick={() => restartBoard()} 
                        disabled={boardStats.currentState !== 'ableToRestart'}
                        className={`${boardStats.currentState === 'ableToRestart' ? 'text-black hover:cursor-pointer border-black' : 'text-gray-300 hover:cursor-not-allowed border-gray-300'} text-sm font-semibold shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-lg border-2 bg-gray-100 px-2 py-1 w-fit`}
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