import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcPlus } from '@proton/icons/icons/IcPlus';

import { MAX_CUSTOM_ADDRESSES } from '../../../constants';
import { useMonitor } from '../MonitorContext';

export const CustomAddressAddButton: FC = () => {
    const { breaches, addAddress } = useMonitor();
    const disabled = breaches.data.custom.length >= MAX_CUSTOM_ADDRESSES;

    return (
        <Button
            aria-label={c('Action').t`Add address`}
            icon
            pill
            size="small"
            shape="solid"
            color="weak"
            disabled={disabled}
            onClick={addAddress}
        >
            <IcPlus />
        </Button>
    );
};
