import { useCallback, useState } from 'react';
import { useModalState } from '../../../components';

function useEditorModal<P>() {
    const [defaultFontModalProps, setDefaultModalProps, render] = useModalState();
    const [modalProps, setModalProps] = useState<P>();

    const showModal = useCallback((props: P) => {
        setDefaultModalProps(true);
        setModalProps(props);
    }, []);

    return { showCallback: showModal, props: { ...defaultFontModalProps, ...modalProps }, render };
}

export default useEditorModal;
