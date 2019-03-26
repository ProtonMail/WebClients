import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import ModalWithPortal from './ModalWithPortal';

import Header from './Header';

const Modal = ({ show, onClose, modalClassName, children, modalTitleID, closeOnOuterClick, closeOnEscape, title }) => {
    const onKeydown = (event) => {
        const key = keycode(event);

        if (closeOnEscape && key === 'escape') {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener('keydown', onKeydown);
        return () => {
            document.removeEventListener('keydown', onKeydown);
        };
    }, []);

    const handleClickOutside = (event) => {
        if (!closeOnOuterClick) {
            return;
        }

        if (event.target.classList.contains('pm-modalOverlay')) {
            onClose(event);
        }
    };

    if (!show) {
        return null;
    }

    return (
        <ModalWithPortal>
            <div className="pm-modalOverlay" onClick={handleClickOutside}>
                <dialog className={`pm-modal ${modalClassName}`} open aria-labelledby={modalTitleID}>
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
    closeOnEscape: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    modalClassName: PropTypes.string,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    title: PropTypes.string
};

Modal.defaultProps = {
    closeOnOuterClick: true,
    closeOnEscape: true,
    show: false,
    modalTitleID: 'modalTitle',
    modalClassName: ''
};

export default Modal;
