import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { OverlayModal } from 'react-components';
import { withRouter } from 'react-router-dom';

const ModalsContainer = ({ modals, removeModal, hideModal, location }) => {
    const [containerIsClosing, setContainerIsClosing] = useState(false);

    useEffect(() => {
        if (location.state && location.state.ignoreClose) {
            return;
        }
        modals.forEach(({ id, content }) => {
            if (content.props.disableCloseOnLocation) {
                return;
            }
            content.props.onClose && content.props.onClose();
            hideModal(id);
        });
    }, [location && location.pathname]);

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
            const { id, content } = lastModal;

            if (!content.props.disableCloseOnEscape && event.key === 'Escape') {
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

    const handleContainerAnimationEnd = () => {
        setContainerIsClosing(false);
    };

    return (
        <>
            <OverlayModal isClosing={containerIsClosing} onExit={handleContainerAnimationEnd} />
            {list}
        </>
    );
};

ModalsContainer.propTypes = {
    modals: PropTypes.arrayOf(PropTypes.object).isRequired,
    removeModal: PropTypes.func.isRequired,
    hideModal: PropTypes.func.isRequired,
    location: PropTypes.object
};

export default withRouter(ModalsContainer);
