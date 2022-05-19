import { motion } from 'framer-motion'

type Props = {
    id: string;
    clicked: boolean;
    imageUrl: string;
    cardClicked: (id: string) => void
}

export default function TrmCard({ id, clicked, imageUrl, cardClicked }: Props) {
    return (
        <motion.div 
            className="shadow-lg hover:cursor-pointer rounded-2xl h-40 bg-pink-500 flex flex-col justify-center"
            onClick={() => cardClicked(id)}
            initial="hidden"
            whileInView="visible"
            transition={{ duration: 0.3 }}
            variants={{
                visible: { opacity: 1, scale: 1 },
                hidden: { opacity: 0, scale: 0 }
            }}
            whileHover={{
                scale: 1.1,
                transition: { duration: 0.1 },
            }}
            whileTap={{ rotate: 360 }}
        >
            { clicked ? <img src={'/' + imageUrl} className="object-cover rounded-2xl" /> : <p className="text-white my-0 mx-auto font-bold text-2xl">TRM</p> }
        </motion.div>
    )
}