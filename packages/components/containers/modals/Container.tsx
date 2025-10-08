import { cloneElement } from 'react';

import BackdropContainer from '../../components/modalTwo/BackdropContainer';
import type { Modal } from './interface';

export interface ModalPropsInjection {
    key: string;
    onClose: () => void;
    onExit: () => void;
    open: boolean;
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
                open: !isClosing,
                isClosing,
                key: id,
            };

            return cloneElement(content, props);
        })}
    </>
);

export default ModalsContainer;
