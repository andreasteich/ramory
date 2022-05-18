type Props = {
    myself?: boolean
    username: string
    matchedPairs: number
    isMyTurn: boolean
}

export default function PlayerCard({ isMyTurn, myself, username, matchedPairs }: Props) {
    return (
        <div className="rounded-xl border-2 border-pink-500 p-4 flex flex-col gap-2 basis-1/3">
            <div className="">
                <h3 className="font-bold text-lg">{username} {myself && '(me)'} {isMyTurn && '👈🏻'}</h3>
            </div>
            <div className="flex flex-col gap">
                <h4 className="text-4xl text-pink-500">{matchedPairs}/10</h4>
                <p className="text-sm text-gray-500">matched pairs</p>
            </div>
        </div>
    )
}