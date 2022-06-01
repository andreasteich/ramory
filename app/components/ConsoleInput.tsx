import { historySliceTextColor } from "~/utils"

type Props = {
    currentHistorySlice: any | undefined
}

export default function ConsoleInput({ currentHistorySlice }: Props) {
    return (
        <div className="rounded-b-lg font-mono border-x-2 border-b-2 border-gray-600 bg-black">
            <p className={`${historySliceTextColor(currentHistorySlice.type)} px-2 py-1`}>{currentHistorySlice?.from}: <strong>{currentHistorySlice?.message}</strong></p>
        </div>
    )
}