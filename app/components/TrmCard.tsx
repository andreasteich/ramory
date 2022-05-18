import { useState } from "react"

type Props = {
    id: string;
    clicked: boolean;
    imageUrl: string;
    cardClicked: (id: string) => void
}

export default function TrmCard({ id, clicked, imageUrl, cardClicked }: Props) {
    return (
        <div 
            className="shadow-lg hover:cursor-pointer rounded-2xl h-40 bg-pink-500 flex flex-col justify-center"
            onClick={() => cardClicked(id)}
        >
            { clicked ? <img src={'/' + imageUrl} className="object-cover rounded-2xl" /> : <p className="text-white my-0 mx-auto font-bold text-2xl">TRM</p> }
        </div>
    )
}