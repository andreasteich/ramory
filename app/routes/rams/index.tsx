import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/cloudflare"
import { Form, Link, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import Modal from "~/components/Modal"

export const loader: LoaderFunction = async ({ context, request }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    if (!session.has('username')) {
        return redirect('/')
    }

    const response = await fetch('http://localhost:8787/rams')
    const rams = await response.json()

    return json({
        username: session.get('username'),
        rams
    })
} 

export const action: ActionFunction = async ({ context, request }) => {
    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie);

    const {
        ramType,
        matchedPairsTotal,
        topic
    } = Object.fromEntries(await request.formData())

    const payload = {
        username: session.get('username'),
        cookie,
        isPrivate: ramType === 'private',
        totalPairsMatched: matchedPairsTotal,
        topic
    }

    const response = await fetch('http://localhost:8787/rams', { 
        method: 'POST',
        body: JSON.stringify(payload)
    })

    const { ramId } = await response.json()

    return redirect(`/rams/${ramId}`)
}

export default function Rams() {
    const { username, rams } = useLoaderData()
    const [visible, setVisible] = useState(false)

    return (
        <div className="flex flex-col gap-20">
            <div className="flex flex-col gap-2">
                <div className="flex flex-row justify-between items-center">
                    <h1 className="font-bold text-6xl">RAMory</h1>
                    <Form method="post" action="/sign-out">
                        <button type="submit" className="text-pink-500">Sign out</button>
                    </Form>
                </div>
                <h2 className="text-xl text-gray-500">Welcome, {username}</h2>
            </div>
            <div className="flex flex-col gap-10">
                <div className="flex flex-row justify-between">
                    <h1 className="text-4xl font-bold">Rams</h1>
                    <button 
                        onClick={() => setVisible(true)}
                        className="px-4 py-2 bg-pink-500 text-white font-semibold hover:bg-pink-600 rounded-lg"
                    >Create Ram</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    { rams.map(({ id, player }) => (
                        <div key={id} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <p className="font-bold">{id}</p>
                                <p>Waiting for you: {player}</p>
                            </div>
                            <Link to={id}>
                                <p className="px-4 py-2 text-center bg-gray-200 hover:bg-gray-300 rounded-lg text-pink-500">Ready to ramble</p>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
            {visible && (
                <Modal closeModal={() => setVisible(false)}>
                    <div className="flex flex-col gap-10">
                        <h2 className="text-4xl font-semibold">How do you like your RAM?</h2>
                        <Form reloadDocument method="post" className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="private" name="ramType" value="private" defaultChecked />
                                    <label htmlFor="private">Private</label>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="public" name="matchedPairsTotal" value="public" defaultChecked />
                                    <label htmlFor="public">Public</label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="5" name="matchedPairsTotal" value="5" />
                                    <label htmlFor="5">5 pairs to win</label>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="10" name="matchedPairsTotal" value="10" defaultChecked />
                                    <label htmlFor="10">10 pairs to win</label>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="15" name="matchedPairsTotal" value="15" />
                                    <label htmlFor="15">15 pairs to win</label>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="cars" name="topic" value="cars" defaultChecked />
                                    <label htmlFor="cars">Cars</label>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="wrestling" name="topic" value="wrestling" disabled />
                                    <label htmlFor="wrestling">Wrestling</label>
                                </div>
                                <div className="flex flex-row gap-2 items-center">
                                    <input type="radio" id="brands" name="topic" value="brands" disabled />
                                    <label htmlFor="brands">Brands</label>
                                </div>
                            </div>
                            <button 
                                className="rounded-lg hover:bg-pink-600 bg-pink-500 py-2 px-4 text-white" 
                                type="submit"
                            >Create</button>
                        </Form>
                    </div>
                    
                </Modal>
            )}
       </div>
    )
}