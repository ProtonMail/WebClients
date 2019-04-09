import React from 'react';
import PropTypes from 'prop-types';
import { Toggle, useApiWithoutResult, useEventManager, useToggle } from 'react-components';
import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';

const { EMBEDDED } = SHOW_IMAGES;

const EmbeddedToggle = ({ id, showImages, onChange }) => {
    const { call } = useEventManager();
    const { request, loading } = useApiWithoutResult(updateShowImages);
    const { state, toggle } = useToggle(hasBit(showImages, EMBEDDED));
    const handleChange = async ({ target }) => {
        const bit = target.checked ? setBit(showImages, EMBEDDED) : clearBit(showImages, EMBEDDED);
        await request(bit);
        await call();
        toggle();
        onChange(bit);
    };
    return <Toggle id={id} checked={state} onChange={handleChange} disabled={loading} />;
};

EmbeddedToggle.propTypes = {
    id: PropTypes.string,
    showImages: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired
};

export default EmbeddedToggle;
