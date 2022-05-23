import { ActionFunction, json, LoaderFunction, redirect } from "@remix-run/cloudflare"
import { Form, Link, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import Modal from "~/components/Modal"
import RamCard from "~/components/RamCard"
import Toggle from "~/components/Toggle"
import { PlusIcon } from '@heroicons/react/outline'

export const loader: LoaderFunction = async ({ context, request }) => {
    const session = await context.sessionStorage.getSession(
        request.headers.get("Cookie")
    );

    if (!session.has('username')) {
        return redirect('/')
    }

    const response = await fetch('https://ram.ramory.workers.dev/rams')
    const rams = await response.json()

    return json({
        username: session.get('username'),
        rams
    })
} 

export const action: ActionFunction = async ({ context, request }) => {
    const cookie = request.headers.get("Cookie")
    const session = await context.sessionStorage.getSession(cookie)

    const { ramType, allowedPlayersInTotal } = Object.fromEntries(await request.formData())

    console.log(ramType, allowedPlayersInTotal)

    const payload = {
        username: session.get('username'),
        cookie,
        isPrivate: ramType === 'private',
        allowedPlayersInTotal
    }

    const response = await fetch('https://ram.ramory.workers.dev/rams', { 
        method: 'POST',
        body: JSON.stringify(payload)
    })

    const { ramId } = await response.json()

    return redirect(`/rams/${ramId}`)
}

export default function Rams() {
    const { username, rams } = useLoaderData()
    const [visible, setVisible] = useState(true)

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
                    <h1 className="text-4xl">Public Rams</h1>
                    <button 
                        onClick={() => setVisible(true)}
                        className="px-4 py-2 bg-gray-200 text-pink-500 hover:bg-gray-300 rounded-lg flex flex-row gap-2 items-center"
                    ><PlusIcon className="h-4" /> Create Ram</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
                    { rams.length ? 
                        rams.map(ram => (
                            <RamCard key={ram.id} {...ram} />
                        )) :
                        <div>
                            <p>No public rams available, create the first one!</p>
                        </div>
                    }
                    
                </div>
            </div>
            {visible && (
                <Modal closeModal={() => setVisible(false)}>
                    <div className="flex flex-col gap-20">
                        <div className="flex flex-col gap-5">
                            <h2 className="text-4xl font-semibold">How do you like your RAM?</h2>
                            <h3 className="text-gray-500">Configure your own RAM, you decide which mode to play, how much player in total you like and if it should be private or not.</h3>
                        </div>
                        <Form reloadDocument method="post" className="flex flex-col gap-20 items-start">
                            <div className="flex flex-col gap-10 items-start">
                                <Toggle id="ramType" label="private RAM" />
                                <input type="number" required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" name="allowedPlayersInTotal" placeholder="How much player in total?" />
                            </div>
                            <button 
                                className="rounded-lg hover:bg-pink-600 bg-pink-500 py-2 px-4 text-white" 
                                type="submit"
                            >Ready to RAMble</button>
                        </Form>
                    </div>
                    
                </Modal>
            )}
       </div>
    )
}