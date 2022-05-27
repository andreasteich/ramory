import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

type Props = {
    reactions: {
        label: string,
        value: string
    }[]
    sendQuickReaction: (message: string) => void
}

export default function QuickReactions({ reactions, sendQuickReaction }: Props) {
    const [sendingPossible, setSendingPossible] = useState(true)

    const handleSend = (value: string) => {
        if (sendingPossible) {
            setSendingPossible(false)
            sendQuickReaction(value)
        }
    }

    useEffect(() => {
        setTimeout(() => setSendingPossible(true), 10000)
    }, [sendingPossible])

    return (
        <div className="flex flex-row gap-2 bg-gray-300 px-2 py-1 rounded-full">
            { reactions.map(({ label, value }) => (
            <motion.p
                key={value}
                onClick={() => handleSend(value)}
                className="hover:cursor-pointer"
                whileHover={{
                    scale: sendingPossible ? 1.2 : 1.0,
                    transition: { duration: 0.1 },
                }}
                whileTap={{ rotate: sendingPossible ? 360 : 0 }}
            >{label}</motion.p>
        ))}
        </div>
    )
}