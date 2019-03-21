import ReactDOM from 'react-dom';
import { useEffect } from 'react';

import useInstance from '../../hooks/useInstance';

const ModalWithPortal = ({ children }) => {
    const el = useInstance(() => document.createElement('div'));

    useEffect(() => {
        const modalRoot = document.querySelector('.modal-root');

        modalRoot.appendChild(el);
        return () => {
            modalRoot.removeChild(el);
        };
    }, []);

    return ReactDOM.createPortal(children, el);
};

export default ModalWithPortal;
