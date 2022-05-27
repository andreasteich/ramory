import Toast from "./Toast";

export default function ToastsContainer({ toasts, removeToast }: any) {
    /*const transitions = useTransition(toasts, toast => toast.id, {
      from: { right: "-100%" },
      enter: { right: "0%" },
      leave: { right: "-100%" }
    });*/
  
    return (
        <div className="absolute top-0 right-0 z-10 p-4 flex flex-col gap-2">
        {toasts.map(({ id, message }: any) => (
            <Toast key={id} id={id} message={message} removeToast={removeToast} />
        ))}
        </div>
    )
  };