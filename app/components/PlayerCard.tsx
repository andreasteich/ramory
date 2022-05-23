type Props = {
    myself: boolean
    username: string
    matchedPairs: number
    active: boolean
}

export default function PlayerCard({ active, myself, username, matchedPairs }: Props) {
    return (
        <div className="flex flex-row gap-5 items-center">
            <h3 className={`${active && 'text-pink-500 font-semibold'}`}>{username} {myself && '(me)'} {active && '👈🏻'}</h3>
            <h4 className={`text-gray-400 ${active ? 'text-black-500' : 'text-pink-500'}`}>{matchedPairs} GB</h4>
        </div>
    )
}