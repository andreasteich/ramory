type Props = {
    myself?: boolean
    username: string
    matchedPairs: number
    isMyTurn: boolean
    totalPairsMatched: number
}

export default function PlayerCard({ isMyTurn, myself, username, matchedPairs, totalPairsMatched }: Props) {
    return (
        <div className={`rounded-xl ${isMyTurn && 'bg-pink-500'} border p-4 flex flex-row gap-2 basis-1/3 justify-between items-center`}>
            <div className="flex flex-col">
                <h3 className="font-bold text-lg">{username} {myself && '(me)'}</h3>
                <p>🤔 🥳 🥸 🤗</p>
            </div>
            <h4 className={`text-4xl ${isMyTurn ? 'text-black-500' : 'text-pink-500'}`}>{matchedPairs}/{totalPairsMatched}</h4>
        </div>
    )
}