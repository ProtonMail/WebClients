import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import OverlayModal from '../../components/modal/Overlay';

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
            isFirst,
            isLast,
            isBehind,
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

export default ModalsContainer;
