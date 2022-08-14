import { useCallback, useState } from 'react';

import { useModalState } from '../../../components';

function useEditorModal<P>() {
    const [modalsStateProps, openModal, render] = useModalState();
    const [modalProps, setModalProps] = useState<P>();

    const showModal = useCallback((props: P) => {
        setModalProps(props);
        openModal(true);
    }, []);

    return { showCallback: showModal, props: modalProps, modalsStateProps, render };
}

export default useEditorModal;
