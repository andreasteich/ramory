import { useEffect } from "react";
import { useToast } from "~/contexts/ToastContext";

type Props = {
    id: string
    message: string
    type: string
}

export default function Toast({ id, message, removeToast }: any) {
    useEffect(() => {
        const timer = setTimeout(() => {
          removeToast(id);
        }, 3000);
    
        return () => {
          clearTimeout(timer);
        };
      }, [id, removeToast]);

    return (
        <div className="flex flex-row gap-5 items-center rounded-md bg-indigo-50 p-4">
            <p className="text-indigo-500">📖 Syslog</p>
            <p className="text-indigo-500"><strong>{message}</strong></p>
            <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                    <button
                        onClick={() => removeToast(id)}
                        className="inline-flex bg-indigo-50 rounded-md p-1.5 text-indigo-500 hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-indigo-50 focus:ring-indigo-600"
                    >
                        <span className="sr-only">Dismiss</span>
                        <svg
                            className="h-5 w-5"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                        <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                        />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}