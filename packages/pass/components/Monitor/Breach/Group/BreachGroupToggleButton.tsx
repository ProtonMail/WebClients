import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { monitorToggle } from '@proton/pass/store/actions';
import { monitorToggleRequest } from '@proton/pass/store/actions/requests';
import { selectMonitorSettings } from '@proton/pass/store/selectors';

type Props = { type: AddressType.ALIAS | AddressType.PROTON };

const SETTINGS_MAP = {
    [AddressType.ALIAS]: 'Aliases' as const,
    [AddressType.PROTON]: 'ProtonAddress' as const,
};

export const BreachGroupToggleButton: FC<Props> = ({ type }) => {
    const key = SETTINGS_MAP[type];
    const settings = useSelector(selectMonitorSettings);
    const monitored = settings?.[key];

    const { dispatch, loading } = useRequest(monitorToggle, { initialRequestId: monitorToggleRequest() });

    return (
        <Button pill shape="solid" color="weak" onClick={() => dispatch({ [key]: !monitored })} loading={loading}>
            {monitored ? c('Action').t`Pause monitoring` : c('Action').t`Resume monitoring`}
        </Button>
    );
};
