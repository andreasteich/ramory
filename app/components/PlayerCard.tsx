type Props = {
    myself: boolean
    username: string
    matchedPairs: number
    active: boolean
}

export default function PlayerCard({ active, myself, username, matchedPairs }: Props) {
    return (
        <div className={`rounded-xl ${active && 'bg-pink-500'} border p-4 flex flex-row gap-2 basis-1/3 justify-between items-center`}>
            <div className="flex flex-col">
                <h3 className="font-bold text-lg">{username} {myself && '(me)'}</h3>
                <p>🤔 🥳 🥸 🤗</p>
            </div>
            <h4 className={`text-4xl ${active ? 'text-black-500' : 'text-pink-500'}`}>{matchedPairs}</h4>
        </div>
    )
}