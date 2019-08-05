import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useEventManager, useToggle, useNotifications, useApi, useLoading } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';
import { c } from 'ttag';

const { REMOTE } = SHOW_IMAGES;

const RemoteToggle = ({ id, showImages, onChange }) => {
    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hasBit(showImages, REMOTE));
    const handleChange = async (checked) => {
        const bit = checked ? setBit(showImages, REMOTE) : clearBit(showImages, REMOTE);
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

RemoteToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default RemoteToggle;
