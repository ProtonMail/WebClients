import { useCallback, useState } from 'react';
import { useModalState } from '../../../components';

function useEditorModal<P>() {
    const [defaultFontModalProps, setDefaultModalProps] = useModalState();
    const [modalProps, setModalProps] = useState<P>();

    const showModal = useCallback((props: P) => {
        setDefaultModalProps(true);
        setModalProps(props);
    }, []);

    return { showCallback: showModal, props: { ...defaultFontModalProps, ...modalProps } };
}

export default useEditorModal;
