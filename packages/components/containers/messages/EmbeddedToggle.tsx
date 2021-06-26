import React from 'react';
import { c } from 'ttag';

import { SHOW_IMAGES } from 'proton-shared/lib/constants';
import { updateShowImages } from 'proton-shared/lib/api/mailSettings';
import { setBit, clearBit, hasBit } from 'proton-shared/lib/helpers/bitset';

import { Toggle } from '../../components';
import { useApi, useEventManager, useToggle, useNotifications, useLoading } from '../../hooks';

const { EMBEDDED } = SHOW_IMAGES;

interface Props {
    id: string;
    showImages: number;
    onChange: (value: number) => void;
}

const EmbeddedToggle = ({ id, showImages, onChange }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const { call } = useEventManager();
    const api = useApi();
    const { state, toggle } = useToggle(hasBit(showImages, EMBEDDED));

    const handleChange = async (checked: boolean) => {
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

export default EmbeddedToggle;
