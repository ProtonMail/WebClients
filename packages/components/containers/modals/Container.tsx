import { cloneElement } from 'react';

import ModalErrorBoundary from '../app/ModalErrorBoundary';
import { Modal } from './interface';
export interface ModalPropsInjection {
    key: string;
    onClose: () => void;
    onExit: () => void;
    isClosing: Modal['isClosing'];
    isFirst?: Modal['isFirst'];
    isLast?: Modal['isLast'];
    isBehind?: Modal['isBehind'];
}

interface Props {
    modals: Modal[];
    removeModal: (id: string) => void;
    hideModal: (id: string) => void;
}


const ModalsContainer = ({ modals, removeModal, hideModal }: Props) => (
    <>
        {modals.map(({ id, content, isClosing, isFirst, isLast, isBehind }) => {
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
        })}
    </>
);

export default ModalsContainer;
