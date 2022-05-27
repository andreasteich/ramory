import { useState, createContext, useContext, useCallback } from "react";
import ToastsContainer from "../components/ToastsContainer";

interface ToastContextModel {
  addToast: (message: string) => void
  removeToast: (id: number) => void
}

const ToastContext = createContext<ToastContextModel>({ 
  addToast: (message: string) => {},
  removeToast: (id: number) => {}
});

let id = 1;

export default function ToastProvider ({ children }: any) {
  const [toasts, setToasts] = useState<any[]>([]);

  const addToast = useCallback(
    message => {
      setToasts(toasts => [
        ...toasts,
        {
          id: id++,
          message
        }
      ]);
    },
    [setToasts]
  );

  const removeToast = useCallback(
    id => {
      setToasts(toasts => toasts.filter(t => t.id !== id));
    },
    [setToasts]
  );

  return (
    <ToastContext.Provider
      value={{
        addToast,
        removeToast
      }}
    >
      <ToastsContainer toasts={toasts} removeToast={removeToast} />
      {children}
    </ToastContext.Provider>
  );
};

const useToast = () => {
  const toastHelpers = useContext(ToastContext);

  return toastHelpers;
};

export { ToastContext, useToast };
