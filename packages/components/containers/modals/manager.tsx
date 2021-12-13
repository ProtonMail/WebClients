import { Dispatch, SetStateAction } from 'react';
import { Modal, ModalManager } from './interface';

export default (modals: Modal[], setModals: Dispatch<SetStateAction<Modal[]>>): ModalManager => {
    const hideModal = (id: string) => {
        return setModals((oldModals: Modal[]) => {
            return oldModals.map((old) => {
                if (old.id !== id) {
                    return old;
                }
                return {
                    ...old,
                    isClosing: true,
                };
            });
        });
    };

    const removeModal = (id: string) => {
        return setModals((oldModals) => {
            return oldModals.filter(({ id: otherId }) => id !== otherId);
        });
    };

    const createModal = (content: JSX.Element | undefined, id = Math.random().toString(36).substr(2, 9)) => {
        setModals((oldModals) => {
            return oldModals.find(({ id: otherId }) => id === otherId)
                ? oldModals
                : [
                      ...oldModals,
                      {
                          id,
                          content,
                          isClosing: false,
                      },
                  ];
        });

        return id;
    };

    const getModal = (id: string) => {
        return modals.find(({ id: otherId }) => id === otherId);
    };

    return {
        createModal,
        hideModal,
        removeModal,
        getModal,
        modals,
    };
};
