import { historySliceTextColor } from "~/utils"

type Props = {
    boardHistory: any[]
}

export default function BoardHistory({ boardHistory }: Props) {
    return (
        <div className="flex flex-col justify-end gap-1 rounded-lg font-mono text-sm bg-black border-2 border-gray-600 overflow-y-auto h-[10vh] lg:h-[75vh]">
        { boardHistory.map(({ type, from, message }, index) => (
            <p key={index} className={`${historySliceTextColor(type)} px-2 py-1`}>
                {from}: <strong>{message}</strong>
                { type === 'end' && (
                <p>Created with 🤙🏻 by <a className="text-blue-600" href="https://twitter.com/Andifined97" target="_blank">@Andifined97</a> and <a className="text-blue-600" href="https://twitter.com/MatthiasSiml" target="_blank">@dev-hias</a></p>
                )}
            </p>
        ))}
        </div>
    )
}