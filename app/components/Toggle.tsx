import { useState } from "react"

type Props = {
    id: string
    label: string
    required?: boolean
}

export default function Toggle({ id, label, required }: Props) {
    const [isToggled, setIsToggled] = useState(true)

    return (
        <div className="flex items-center justify-center">
            <label htmlFor={id} className="flex items-center cursor-pointer">
                <div className="relative">
                    <input type="checkbox" id={id} name={id} className="sr-only" value="private" onChange={() => setIsToggled(!isToggled)} checked={isToggled} required={required} />
                    <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
                    <div 
                        style= {{
                            transform: isToggled ? 'translateX(100%)' : '',
                            backgroundColor: isToggled ? '#48bb78' : ''
                        }}
                        className="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"
                    ></div>
                </div>
                <div className="ml-3 text-gray-700 font-medium">{label}</div>
            </label>
        </div>
    )
}