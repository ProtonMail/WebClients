import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { t } from 'ttag';

import ModalWithPortal from './ModalWithPortal';

import { getClasses } from '../../helpers/component';
import Header from './Header';

const Modal = ({ show, onClose, modalClassName, children, modalTitleID, closeOnOuterClick, title }) => {
    if (!show) {
        return null;
    }

    const handleClickOutside = (event) => {
        if (!closeOnOuterClick) {
            return;
        }

        if (event.target.classList.contains('pm-modalOverlay')) {
            onClose(event);
        }
    }

    return (
        <ModalWithPortal>
            <div className="pm-modalOverlay" title={t`Close modal`} onClick={handleClickOutside}>
                <dialog className={getClasses('pm-modal', modalClassName)} open aria-labelledby={modalTitleID}>
                    {title ? <Header onClose={onClose}>{title}</Header> : null}
                    {children}
                </dialog>
            </div>
        </ModalWithPortal>
    );
};

Modal.propTypes = {
    show: PropTypes.bool.isRequired,
    closeOnOuterClick: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    modalClassName: PropTypes.string,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    title: PropTypes.string
};

Modal.defaultProps = {
    closeOnOuterClick: true,
    show: false,
    modalTitleID: 'modalTitle'
};

export default Modal;
