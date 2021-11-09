import { cloneElement, useState } from 'react';

import OverlayModal from '../../components/modal/Overlay';
import ModalErrorBoundary from '../app/ModalErrorBoundary';
import { Modal } from './interface';

interface Props {
    modals: Modal[];
    removeModal: (id: string) => void;
    hideModal: (id: string) => void;
}

export interface ModalPropsInjection {
    key: string;
    onClose: () => void;
    onExit: () => void;
    isClosing: Modal['isClosing'];
    isFirst?: Modal['isFirst'];
    isLast?: Modal['isLast'];
    isBehind?: Modal['isBehind'];
}

const ModalsContainer = ({ modals, removeModal, hideModal }: Props) => {
    const [containerIsClosing, setContainerIsClosing] = useState(false);

    const list = modals.map(({ id, content, isClosing, isFirst, isLast, isBehind }) => {
        if (!content) {
            return null;
        }

        const handleModalExit: ModalPropsInjection['onExit'] = () => {
            content.props.onExit?.();
            removeModal(id);
        };

        const handleModalClose: ModalPropsInjection['onClose'] = () => {
            content.props.onClose?.();
            hideModal(id);
        };

        const props: ModalPropsInjection = {
            onClose: handleModalClose,
            onExit: handleModalExit,
            isFirst,
            isLast,
            isBehind,
            isClosing,
            key: id,
        };

        return <ModalErrorBoundary {...props}>{cloneElement(content, props)}</ModalErrorBoundary>;
    });

    return (
        <>
            {(modals.length >= 1 || containerIsClosing) && (
                <OverlayModal
                    isClosing={!modals.length || (modals.length === 1 && modals[0].isClosing)}
                    onStart={() => {
                        setContainerIsClosing(true);
                    }}
                    onExit={() => {
                        setContainerIsClosing(false);
                    }}
                />
            )}
            {list}
        </>
    );
};

export default ModalsContainer;
