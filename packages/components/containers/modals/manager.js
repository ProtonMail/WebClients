export default (setModals) => {
    let idx = 1;

    const hideModal = (id) => {
        return setModals((oldModals) => {
            return oldModals.map((old) => {
                if (old.id !== id) {
                    return old;
                }
                return {
                    ...old,
                    isClosing: true
                };
            });
        });
    };

    const createModal = (content, options = {}) => {
        const id = idx++;

        if (idx >= 1000) {
            idx = 0;
        }

        return setModals((oldModals) => {
            return [
                ...oldModals,
                {
                    id,
                    content,
                    closeOnEscape: true,
                    closeOnOuterClick: true,
                    ...options,
                    isClosing: false
                }
            ];
        });
    };

    const removeModal = (id) => {
        return setModals((oldModals) => {
            return oldModals.filter(({ id: otherId }) => id !== otherId);
        });
    };

    return {
        createModal,
        hideModal,
        removeModal,
        resetModals: () => setModals([])
    };
};
