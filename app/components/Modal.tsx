import { ReactNode } from "react"

type Props = {
    children: ReactNode,
    closeModal: () => void
}

export default function Modal({ children, closeModal }: Props) {
    return (
        <div className="fixed left-0 top-0 w-full h-full bg-black/75 z-1 flex flex-col items-center">
            <div className="rounded-lg bg-white p-10 mx-[5%] my-[10%] flex flex-col gap-5 lg:w-[1024px]">
                <span onClick={closeModal}>&times;</span>
                {children}
            </div>
        </div>
    )
}