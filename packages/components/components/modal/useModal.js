import { useState } from 'react';

const useModal = (initialState = false) => {
    const [isOpen, setModalState] = useState(initialState);
    const open = () => setModalState(true);
    const close = () => setModalState(false);
    const toggle = () => setModalState(!isOpen);

    return {
        isOpen,
        open,
        toggle,
        close
    };
};

export default useModal;