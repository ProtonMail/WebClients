import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApi, useEventManager, useToggle, useNotifications, useLoading } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';
import { c } from 'ttag';

const { EMBEDDED } = SHOW_IMAGES;

const EmbeddedToggle = ({ id, showImages, onChange }) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hasBit(showImages, EMBEDDED));
    const handleChange = async (checked) => {
        const bit = checked ? setBit(showImages, EMBEDDED) : clearBit(showImages, EMBEDDED);
        await api(updateShowImages(bit));
        await call();
        toggle();
        onChange(bit);
        createNotification({ text: c('Success').t`Preference saved` });
    };
    return (
        <Toggle
            id={id}
            checked={state}
            onChange={({ target }) => withLoading(handleChange(target.checked))}
            loading={loading}
        />
    );
};

EmbeddedToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
};

export default EmbeddedToggle;
