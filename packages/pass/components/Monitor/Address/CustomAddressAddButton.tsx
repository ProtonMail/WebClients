import type { FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { MAX_CUSTOM_ADDRESSES } from '@proton/pass/constants';

export const CustomAddressAddButton: FC = () => {
    const { breaches, addAddress } = useMonitor();
    const disabled = breaches.data.custom.length >= MAX_CUSTOM_ADDRESSES;

    return (
        <Button icon pill size="small" shape="solid" color="weak" disabled={disabled} onClick={addAddress}>
            <Icon name="plus" />
        </Button>
    );
};
