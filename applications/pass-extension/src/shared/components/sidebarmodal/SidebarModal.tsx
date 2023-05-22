import type { FC } from 'react';

import type { ModalProps } from '@proton/components';
import { ModalTwo } from '@proton/components';

import './SidebarModal.scss';

export const SidebarModal: FC<ModalProps> = ({ children, className, ...props }) => {
    return (
        <ModalTwo
            rootClassName="pass-modal-two--sidebar"
            className={className}
            onBackdropClick={props.onClose}
            {...props}
        >
            <div className="h100">{children}</div>
        </ModalTwo>
    );
};
