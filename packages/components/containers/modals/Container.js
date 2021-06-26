import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import OverlayModal from '../../components/modal/Overlay';
import ModalErrorBoundary from '../app/ModalErrorBoundary';

const ModalsContainer = ({ modals, removeModal, hideModal }) => {
    const [containerIsClosing, setContainerIsClosing] = useState(false);

    useEffect(() => {
        // Start hiding the container if the last modal wants to close
        if (modals.length === 1 && modals[0].isClosing) {
            return setContainerIsClosing(true);
        }

        if (modals.length >= 1) {
            return setContainerIsClosing(false);
        }
    }, [modals]);

    if (modals.length === 0 && !containerIsClosing) {
        return null;
    }

    const list = modals.map(({ id, content, isClosing, isFirst, isLast, isBehind }) => {
        if (!content) {
            return null;
        }

        const handleModalExit = () => {
            content.props.onExit?.();
            removeModal(id);
        };

        const handleModalClose = () => {
            content.props.onClose?.();
            hideModal(id);
        };

        const props = {
            onClose: handleModalClose,
            onExit: handleModalExit,
            isFirst,
            isLast,
            isBehind,
            isClosing,
            key: id,
        };

        return <ModalErrorBoundary {...props}>{React.cloneElement(content, props)}</ModalErrorBoundary>;
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
};

export default ModalsContainer;
