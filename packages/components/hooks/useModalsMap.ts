import { useState } from 'react';

import { ModalWithProps } from '@proton/shared/lib/interfaces/Modal';

export const useModalsMap = <T extends Record<string, ModalWithProps<any>>>(map: T) => {
    const [modalsMap, setModalsMap] = useState<T>(map);

    const updateModal = <K extends keyof T>(key: K, newValue: T[K]) =>
        setModalsMap((prevState) => ({
            ...prevState,
            [key]: newValue,
        }));

    const closeModal = (key: keyof T) =>
        setModalsMap((prevState) => ({
            ...prevState,
            [key]: {
                isOpen: false,
            },
        }));

    return { modalsMap, closeModal, setModalsMap, updateModal };
};
