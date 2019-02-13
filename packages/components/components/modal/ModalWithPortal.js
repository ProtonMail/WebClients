import ReactDOM from 'react-dom';
import React, { useState, useEffect } from 'react';

const ModalWithPortal = ({ children }) => {
    const [el] = useState(() => document.createElement('div'));

    useEffect(() => {
        const modalRoot = document.querySelector('.modal-root');

        modalRoot.appendChild(el);
        return () => {
            modalRoot.removeChild(el);
        }
    }, [])

    return ReactDOM.createPortal(children, el);
}

export default ModalWithPortal;
