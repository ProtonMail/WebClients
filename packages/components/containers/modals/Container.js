import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayModal } from 'react-components';
import { withRouter } from 'react-router-dom';

const ModalsContainer = ({ modals, removeModal, hideModal, location }) => {
    const [containerIsClosing, setContainerIsClosing] = useState(false);

    useEffect(() => {
        modals.forEach(({ id, content }) => {
            content.props.onClose && content.props.onClose();
            hideModal(id);
        });
    }, [location]);

    useEffect(() => {
        // Start hiding the container if the last modal wants to close
        if (modals.length === 1 && modals[0].isClosing) {
            return setContainerIsClosing(true);
        }

        if (modals.length >= 1) {
            return setContainerIsClosing(false);
        }
    }, [modals]);

    useEffect(() => {
        if (modals.length === 0) {
            return;
        }

        const lastModal = modals[modals.length - 1];

        const onKeydown = (event) => {
            const { id, closeOnEscape, content } = lastModal;

            if (closeOnEscape && event.key === 'Escape') {
                event.preventDefault();
                content.props.onClose && content.props.onClose();
                hideModal(id);
            }
        };

        document.addEventListener('keydown', onKeydown);
        return () => {
            document.removeEventListener('keydown', onKeydown);
        };
    }, [modals]);

    if (modals.length === 0 && !containerIsClosing) {
        return null;
    }

    const list = modals.map(({ id, content, isClosing }, i) => {
        const isLast = i === modals.length - 1;

        const handleModalExit = () => {
            content.props.onExit && content.props.onExit();
            removeModal(id);
        };

        const handleModalClose = () => {
            content.props.onClose && content.props.onClose();
            hideModal(id);
        };

        return React.cloneElement(content, {
            onClose: handleModalClose,
            onExit: handleModalExit,
            isBehind: !isLast,
            isClosing,
            key: id
        });
    });

    const handleClickOutside = (event) => {
        if (modals.length === 0) {
            return;
        }

        const { id, closeOnOuterClick, content } = modals[modals.length - 1];

        if (closeOnOuterClick) {
            event.preventDefault();
            content.props.onClose && content.props.onClose();
            hideModal(id);
        }
    };

    const handleContainerAnimationEnd = () => {
        setContainerIsClosing(false);
    };

    return (
        <OverlayModal isClosing={containerIsClosing} onClick={handleClickOutside} onExit={handleContainerAnimationEnd}>
            {list}
        </OverlayModal>
    );
};

ModalsContainer.propTypes = {
    modals: PropTypes.arrayOf(PropTypes.object).isRequired,
    removeModal: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    location: PropTypes.object
};

export default withRouter(ModalsContainer);
