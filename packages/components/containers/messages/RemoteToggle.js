import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager, useToggle } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { REMOTE } = SHOW_IMAGES;

const RemoteToggle = ({ id, showImages, onChange }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateShowImages);
    const { state, toggle } = useToggle(hasBit(showImages, REMOTE));
    const handleChange = async ({ target }) => {
        const bit = target.checked ? setBit(showImages, REMOTE) : clearBit(showImages, REMOTE);
        await request(bit);
        call();
        toggle();
        onChange(bit);
    };
    return <Toggle id={id} checked={state} onChange={handleChange} loading={loading} />;
};

RemoteToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default RemoteToggle;
