type Props = {
    message: string
}

export default function Toast({ message }: Props) { 
    return (
        <div className="bg-gray-300 rounded-lg absolute bottom-0 m-5 right-0">
            <p className="px-4 py-2">
            <strong>Syslog: </strong>{message}
            </p>
        </div>
    )
}
