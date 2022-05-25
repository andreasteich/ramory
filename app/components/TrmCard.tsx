import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type Props = {
    id: string
    clicked: boolean
    imageUrl: any
    isMyTurn: boolean
    active: boolean
    cardClicked: (id: string) => void
}

export default function TrmCard({ id, clicked, imageUrl, active, isMyTurn, cardClicked }: Props) {
    return (
        <motion.div 
            key={id}
            className={`shadow-lg hover:cursor-pointer h-full rounded-2xl ${active ? 'bg-pink-500' : 'bg-gray-300'} flex flex-col justify-center`}
            onClick={isMyTurn && active ? () => cardClicked(id) : () => {}}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.3 }}
            variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 0, scale: 0 }
            }}
            whileHover={{
                scale: active && isMyTurn ? 1.1 : 1.0,
                transition: { duration: 0.1 },
            }}
            whileTap={{ rotate: active && isMyTurn ? 360 : 0 }}
        >
            { clicked ? <p className='text-center text-4xl md:text-6xl p-4'>{ imageUrl }</p> : <p className={`${active ? 'text-black' : 'text-gray-400'} p-4 text-4xl md:text-6xl mx-auto`}>R</p> }
        </motion.div>
    )
}