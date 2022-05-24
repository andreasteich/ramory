import { motion } from 'framer-motion'

type Props = {
    id: string
    clicked: boolean
    imageUrl: any
    active: boolean
    cardClicked: (id: string) => void
}

export default function TrmCard({ id, clicked, imageUrl, active, cardClicked }: Props) {
    return (
        <motion.div 
            className={`shadow-lg hover:cursor-pointer h-full rounded-2xl ${active ? 'bg-pink-500' : 'bg-gray-300'} flex flex-col justify-center`}
            onClick={() => cardClicked(id)}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.3 }}
            variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 0, scale: 0 }
            }}
            whileHover={{
                scale: active ? 1.1 : 1.0,
                transition: { duration: 0.1 },
            }}
            whileTap={{ rotate: active ? 360 : 0 }}
        >
            { clicked ? <p className='text-center'>{ imageUrl }</p> : <p className={`${active ? 'text-black' : 'text-gray-400'} my-0 mx-auto`}>RAM</p> }
        </motion.div>
    )
}