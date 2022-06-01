import { historySliceTextColor } from "~/utils"

type Props = {
    boardHistory: any[]
}

export default function ConsoleHistory({ boardHistory }: Props) {
    return (
        <div className="rounded-t-lg font-mono bg-black border-x-2 border-t-2 border-gray-600">
        { boardHistory.map(({ type, from, message }, index) => (
            <p key={index} className={`${historySliceTextColor(type)} px-2 py-1`}>{from}: <strong>{message}</strong></p>
        ))}
        </div>
    )
}