const updatePosition = (modal, i, arr) => ({
    ...modal,
    isFirst: i === 0,
    isLast: i === arr.length - 1,
    isBehind: i !== arr.length - 1,
});

export default (modals, setModals) => {
    const hideModal = (id) => {
        return setModals((oldModals) => {
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

    const removeModal = (id) => {
        return setModals((oldModals) => {
            return oldModals.filter(({ id: otherId }) => id !== otherId).map(updatePosition);
        });
    };

    const createModal = (content, id = Math.random().toString(36).substr(2, 9)) => {
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
                  ].map(updatePosition);
        });

        return id;
    };

    const getModal = (id) => {
        return modals.find(({ id: otherId }) => id === otherId);
    };

    return {
        createModal,
        hideModal,
        removeModal,
        getModal,
        resetModals: () => setModals([]),
    };
};
