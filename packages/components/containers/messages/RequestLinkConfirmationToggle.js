import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle } from 'react-components';
import { LINK_WARNING } from 'proton-shared/lib/constants';
import { getItem, removeItem, setItem } from 'proton-shared/lib/helpers/storage';

const { KEY, VALUE } = LINK_WARNING;

const RequestLinkConfirmationToggle = ({ id }) => {
    const { state, toggle } = useToggle(!!getItem(KEY));

    const handleChange = async ({ target }) => {
        if (target.checked) {
            setItem(KEY, VALUE);
        } else {
            removeItem(KEY);
        }
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleChange} />;
};

RequestLinkConfirmationToggle.propTypes = {
    id: PropTypes.string
};

export default RequestLinkConfirmationToggle;
