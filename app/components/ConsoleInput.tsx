type Props = {
    notification: any | undefined
}

export default function ConsoleInput({ notification }: Props) {
    return (
        <div className="rounded-b-lg font-mono border-x-2 border-b-2 border-gray-600 bg-black">
            <p className="text-white px-2 py-1">{notification?.from}: <strong>{notification?.message}</strong></p>
        </div>
    )
}