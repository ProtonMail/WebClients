import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { useResolveBreach } from '@proton/pass/hooks/monitor/useResolveBreach';
import type { MonitorAddress } from '@proton/pass/lib/monitor/types';

export const BreachResolveButton: FC<MonitorAddress> = (address) => {
    const { resolve, loading } = useResolveBreach(address);

    return (
        <Button pill shape="solid" color="weak" onClick={resolve} loading={loading}>
            {c('Action').t`Mark as resolved`}
        </Button>
    );
};
