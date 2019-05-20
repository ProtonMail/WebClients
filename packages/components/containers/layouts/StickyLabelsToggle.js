import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useToggle } from 'react-components';
import { STICKY_LABELS } from 'proton-shared/lib/constants';

const { ON, OFF } = STICKY_LABELS;

const StickyLabelsToggle = ({ id, stickyLabels, onToggle, loading, ...rest }) => {
    const { state, toggle } = useToggle(stickyLabels === ON);

    const handleToggle = ({ target }) => {
        onToggle(target.checked ? ON : OFF);
        toggle();
    };

    return <Toggle id={id} checked={state} onChange={handleToggle} disabled={loading} {...rest} />;
};

StickyLabelsToggle.propTypes = {
    id: PropTypes.string.isRequired,
    stickyLabels: PropTypes.number.isRequired,
    onToggle: PropTypes.func.isRequired,
    loading: PropTypes.bool
};

export default StickyLabelsToggle;
