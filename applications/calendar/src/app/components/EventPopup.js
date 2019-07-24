import React from 'react';
import PropTypes from 'prop-types';
import { useModals, SmallButton } from 'react-components';

import EventModal from './modals/EventModal';
import { c } from 'ttag';

const EventPopup = ({}) => {
    const { createModal } = useModals();
    const handleEdit = () => {
        createModal(<EventModal />);
    };
    const handleRemove = () => {};
    const handleClose = () => {};
    return (
        <div className="bg-white">
            <header className="flex flex-nowrap">
                <SmallButton title={c('Action').t`Edit`} onClick={handleEdit} icon="compose" />
                <SmallButton title={c('Action').t`Remove`} onClick={handleRemove} icon="trash" />
                <SmallButton title={c('Action').t`Close`} onClick={handleClose}></SmallButton>
            </header>
            <div className="h3"></div>
        </div>
    );
};

export default EventPopup;
