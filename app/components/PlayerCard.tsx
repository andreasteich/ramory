type Props = {
    myself: boolean
    username: string
    matchedPairs: number
    active: boolean
}

export default function PlayerCard({ active, myself, username, matchedPairs }: Props) {
    return (
        <div className="flex flex-row gap-5 items-center justify-between">
            <h3 className={`${active && 'text-pink-500 font-semibold'}`}>{username} {myself && '(me)'} {active && '👈🏻'}</h3>
            <h4 className={`${active ? 'text-pink-500' : 'text-black-500'}`}>{matchedPairs} GB</h4>
        </div>
    )
}