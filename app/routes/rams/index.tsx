import { json, LoaderFunction } from "@remix-run/cloudflare"
import { Form, Link, useLoaderData } from "@remix-run/react"
import { useState } from "react"
import Modal from "~/components/Modal"

export const loader: LoaderFunction = async () => {
    return json([
        {
            id: '1234',
            player: 'Hans Gustav 1'
        },
        {
            id: '234566',
            player: 'Hans Gustav 2'
        },
        {
            id: '6765940',
            player: 'Hans Gustav 3'
        },
        {
            id: '6765941',
            player: 'Hans Gustav 3'
        },
        {
            id: '6765942',
            player: 'Hans Gustav 3'
        },
        {
            id: '6765943',
            player: 'Hans Gustav 3'
        }
    ])
} 

export default function Rams() {
    const rams = useLoaderData()

    const [visible, setVisible] = useState(false)

    return (
        <div className="flex flex-col gap-20">
            <Link to="/">
                <h1 className="font-bold text-4xl">RAMory</h1>
            </Link>
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
            {visible && (
                <Modal closeModal={() => setVisible(false)}>
                    <div className="flex flex-col gap-10">
                        <h2 className="text-4xl font-semibold">How do you like your RAM?</h2>
                        <Form className="flex flex-col gap-5">
                            <input 
                                type="text" 
                                placeholder="Your username"
                                className="py-2 px-2 border border-gray-300 rounded-lg"
                            />
                            <div className="flex flex-row gap-2 items-center">
                                <input 
                                    type="checkbox"
                                    id="ramType"
                                    name="ramType"
                                    value="private"

                                />
                                <label htmlFor="ramType">Private?</label><br></br>
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
                        </Form>
                        <button 
                            className="rounded-lg hover:bg-pink-600 bg-pink-500 py-2 px-4 text-white" 
                            type="submit"
                        >Create</button>
                    </div>
                    
                </Modal>
            )}
       </div>
    )
}