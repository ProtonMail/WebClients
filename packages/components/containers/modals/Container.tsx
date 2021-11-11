import { cloneElement } from 'react';

import ModalErrorBoundary from '../app/ModalErrorBoundary';
import { Modal } from './interface';
import BackdropContainer from '../../components/modalTwo/BackdropContainer';

export interface ModalPropsInjection {
    key: string;
    onClose: () => void;
    onExit: () => void;
    isClosing: Modal['isClosing'];
}

interface Props {
    modals: Modal[];
    removeModal: (id: string) => void;
    hideModal: (id: string) => void;
}

const ModalsContainer = ({ modals, removeModal, hideModal }: Props) => (
    <>
        <BackdropContainer />
        {modals.map(({ id, content, isClosing }) => {
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
                isClosing,
                key: id,
            };

            return <ModalErrorBoundary {...props}>{cloneElement(content, props)}</ModalErrorBoundary>;
        })}
    </>
);

export default ModalsContainer;
