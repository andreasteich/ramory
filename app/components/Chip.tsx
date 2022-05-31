import { motion } from 'framer-motion'
import { ReactNode } from 'react'

type Props = {
    id: string
    clicked: boolean
    imageUrl: any
    isMyTurn: boolean
    active: boolean
    chipClicked: (id: string) => void
}

export default function Chip({ id, clicked, imageUrl, active, isMyTurn, chipClicked }: Props) {
    return (
        <motion.div 
            key={id}
            className={`shadow-[1px_1px_0_0_rgba(0,0,0,1)] border-2 ${isMyTurn && active ? 'border-green-500' : 'border-black'} hover:cursor-pointer h-full ${active && 'bg-neutral-400'} flex flex-col justify-center`}
            onClick={isMyTurn && active ? () => chipClicked(id) : () => {}}
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
            { clicked ? <p className='text-center text-4xl md:text-6xl'>{ imageUrl }</p> : <img src="/silicon.png" className={`${!active && 'hue-rotate-180 brightness-50'} object-scale-down`}/> }
        </motion.div>
    )
}