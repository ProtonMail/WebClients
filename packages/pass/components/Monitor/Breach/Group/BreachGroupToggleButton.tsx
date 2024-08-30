import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert } from '@proton/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { monitorToggle } from '@proton/pass/store/actions';
import { toggleMonitorRequest } from '@proton/pass/store/actions/requests';
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

    const { dispatch, loading } = useRequest(monitorToggle, { initialRequestId: toggleMonitorRequest() });
    const toggleMonitor = useConfirm(() => dispatch({ [key]: !monitored }));

    return (
        <>
            <Button pill shape="solid" color="weak" onClick={toggleMonitor.prompt} loading={loading}>
                {monitored ? c('Action').t`Pause monitoring` : c('Action').t`Resume monitoring`}
            </Button>

            {toggleMonitor.pending && (
                <ConfirmationModal
                    open
                    onClose={toggleMonitor.cancel}
                    onSubmit={toggleMonitor.confirm}
                    title={monitored ? c('Title').t`Pause monitoring?` : c('Title').t`Resume monitoring?`}
                    submitText={c('Action').t`Confirm`}
                >
                    <Alert className="mb-4" type="info">
                        {monitored
                            ? c('Info').t`You will no longer be notified of data breaches for these email addresses.`
                            : c('Info').t`You will be notified of data breaches for these email addresses.`}
                    </Alert>
                </ConfirmationModal>
            )}
        </>
    );
};
