type Props = {
    username: string
    matchedPairs: number
    incorrectMatches: number
    itsMe: boolean
}

export default function RamCard({ username, matchedPairs, incorrectMatches, itsMe }: Props) {
    console.log(matchedPairs, incorrectMatches)
    const ramCollected = 1000 * matchedPairs - 100 * incorrectMatches

    return (
        <div className="flex font-bold flex-row justify-between shadow-[1px_1px_0_0_rgba(0,0,0,1)] rounded-lg border-2 border-black bg-green-400 px-2 py-1">
            <p>{username} {itsMe && '(me)'}</p>
            <p>{ramCollected > 0 ? ramCollected : 0} MB</p>
        </div>
    )
}