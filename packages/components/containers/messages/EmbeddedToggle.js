import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { EMBEDDED } = SHOW_IMAGES;

const EmbeddedToggle = ({ id, showImages, onChange }) => {
    const { request, loading } = useApiWithoutResult(updateShowImages);
    const [value, setValue] = useState(hasBit(showImages, EMBEDDED));
    const handleChange = async (newValue) => {
        const bit = newValue ? setBit(showImages, EMBEDDED) : clearBit(showImages, EMBEDDED);
        await request(bit);
        // TODO call event manager
        setValue(newValue);
        onChange(bit);
    };
    return <Toggle id={id} value={value} onChange={handleChange} disabled={loading} />;
};

EmbeddedToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EmbeddedToggle;
