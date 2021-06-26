import React from 'react';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';

import { FormModal } from '../modal';

import './ShortcutsModal.scss';

interface Props {
    title?: React.ReactNode;
    children: React.ReactNode;
    onClose?: () => void;
}

const ShortcutsModal = ({ onClose = noop, children, title = c('Title').t`Keyboard Shortcuts`, ...rest }: Props) => {
    return (
        <FormModal
            title={title}
            close={c('Action').t`Close`}
            hasSubmit={false}
            onClose={onClose}
            className="shortcut-modal"
            {...rest}
        >
            {children}
        </FormModal>
    );
};

export default ShortcutsModal;
