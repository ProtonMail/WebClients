import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import keycode from 'keycode';

import ModalWithPortal from './ModalWithPortal';

import Header from './Header';

const Modal = ({ onClose, type, children, modalTitleID, closeOnOuterClick, closeOnEscape, title }) => {
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

    return (
        <ModalWithPortal>
            <div className="pm-modalOverlay" onClick={handleClickOutside}>
                <dialog
                    className={`pm-modal ${type === 'small' ? 'pm-modal--smaller' : ''}`}
                    role="dialog"
                    open
                    aria-labelledby={modalTitleID}
                >
                    {title ? <Header onClose={onClose}>{title}</Header> : null}
                    {children}
                </dialog>
            </div>
        </ModalWithPortal>
    );
};

Modal.propTypes = {
    closeOnOuterClick: PropTypes.bool,
    closeOnEscape: PropTypes.bool,
    onClose: PropTypes.func.isRequired,
    type: PropTypes.string,
    children: PropTypes.node.isRequired,
    modalTitleID: PropTypes.string.isRequired,
    title: PropTypes.string
};

Modal.defaultProps = {
    closeOnOuterClick: true,
    closeOnEscape: true,
    modalTitleID: 'modalTitle'
};

export default Modal;
