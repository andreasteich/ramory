type Props = {
    currentHistorySlice: any | undefined
}

export default function ConsoleInput({ currentHistorySlice }: Props) {
    return (
        <div className="rounded-b-lg font-mono border-x-2 border-b-2 border-gray-600 bg-black">
            <p className="text-white px-2 py-1">{currentHistorySlice?.from}: <strong>{currentHistorySlice?.message}</strong></p>
        </div>
    )
}