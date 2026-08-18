import type { ReactNode } from 'react';
import { useRef } from 'react';
import "../index.css";

type ModalProps = {
    isOpen: boolean;
    closeModal: () => void;
    title: string;
    children: ReactNode
}

const Modal = ({isOpen = false, closeModal, title, children}:ModalProps) => {
    const modalRef = useRef<HTMLDialogElement>(null)

    if (!isOpen)
    {
        modalRef.current?.close();
    }
    else
    {
        modalRef.current?.showModal();
    }



    return(
        <>
        <dialog ref={modalRef} className="modal-main">
            <div >
                <h2 className="page-header-2">{title}</h2>
                <div className="page-flexbox-column">
                    {children}
                </div>
                <button onClick={closeModal} className="link-button">Close</button>
            </div>
        </dialog>
        </>
    );
}

export default Modal;