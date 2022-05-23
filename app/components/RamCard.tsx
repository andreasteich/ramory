import { Link } from "@remix-run/react";

type Props = {
    id: string
    playersWaiting: string[]
    availableSlots: number
}

export default function RamCard({ id, playersWaiting, availableSlots }: Props) {
    return (
        <div className="border rounded-xl p-4 flex flex-col gap-5">
            <h4 className="font-bold">RAM - {id}</h4>
            <div className="flex flex-col gap-2">
                <p>{playersWaiting[0]} is waitin'</p>
                <p className="text-green-500">{availableSlots} slots available</p>
            </div>
            <Link to={id}>
                <p className="px-4 py-2 text-center bg-pink-500 hover:bg-pink-600 rounded-lg text-white">Take it</p>
            </Link>
        </div>
    )
}