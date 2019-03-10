import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { REMOTE } = SHOW_IMAGES;

const RemoteToggle = ({ id, showImages, onChange }) => {
    const { request, loading } = useApiWithoutResult(updateShowImages);
    const [value, setValue] = useState(hasBit(showImages, REMOTE));
    const handleChange = async (newValue) => {
        const bit = newValue ? setBit(showImages, REMOTE) : clearBit(showImages, REMOTE);
        await request(bit);
        setValue(newValue);
        onChange(bit);
    };
    return <Toggle id={id} value={value} onChange={handleChange} disabled={loading} />;
};

RemoteToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default RemoteToggle;
