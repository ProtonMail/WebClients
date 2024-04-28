import type { FC } from 'react';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/index';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';

export const CustomAddressAddButton: FC = () => {
    const monitor = useMonitor();
    return (
        <Button icon pill size="small" shape="solid" color="weak" onClick={() => monitor.addAddress()}>
            <Icon name="plus" />
        </Button>
    );
};
