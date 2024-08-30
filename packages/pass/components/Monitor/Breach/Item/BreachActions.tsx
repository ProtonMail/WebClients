import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Alert } from '@proton/components';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { useConfirm } from '@proton/pass/hooks/useConfirm';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { resolveAddressMonitor, toggleAddressMonitor } from '@proton/pass/store/actions';
import {
    deleteCustomAddressRequest,
    resolveAddressMonitorRequest,
    toggleAddressMonitorRequest,
} from '@proton/pass/store/actions/requests';
import { selectMonitorSettingByType, selectRequestInFlight } from '@proton/pass/store/selectors';

type Props = { resolved: boolean; disabled: boolean } & MonitorAddress;

export const BreachActions: FC<Props> = ({ resolved, disabled, ...address }) => {
    const { monitored, type, email } = address;
    const { deleteAddress } = useMonitor();

    const groupMonitored = useSelector(selectMonitorSettingByType(type));
    const deleting = useSelector(selectRequestInFlight(deleteCustomAddressRequest(email)));

    const addressId = getAddressId(address);
    const resolve = useRequest(resolveAddressMonitor, { initialRequestId: resolveAddressMonitorRequest(addressId) });
    const toggle = useRequest(toggleAddressMonitor, { initialRequestId: toggleAddressMonitorRequest(addressId) });

    const confirmResolve = useConfirm(() => resolve.dispatch(address));
    const confirmToggle = useConfirm(() => toggle.dispatch({ ...address, monitor: !monitored }));
    const confirmDelete = useConfirm(() => deleteAddress(getAddressId(address)));

    return (
        <div className="flex flex-nowrap gap-2">
            {!resolved && (
                <Button
                    pill
                    shape="solid"
                    color="weak"
                    onClick={confirmResolve.prompt}
                    loading={resolve.loading}
                    disabled={resolve.loading}
                >
                    {c('Action').t`Mark as resolved`}
                </Button>
            )}

            <QuickActionsDropdown
                className="shrink-0"
                color="weak"
                disabled={disabled}
                icon="three-dots-vertical"
                originalPlacement="bottom-end"
                pill
                shape="solid"
            >
                <DropdownMenuButton
                    disabled={!groupMonitored}
                    icon={monitored ? 'eye-slash' : 'eye'}
                    label={monitored ? c('Action').t`Pause monitoring` : c('Action').t`Resume monitoring`}
                    loading={toggle.loading}
                    onClick={confirmToggle.prompt}
                />
                {address.type === AddressType.CUSTOM && (
                    <DropdownMenuButton
                        icon="trash"
                        label={c('Action').t`Remove`}
                        loading={deleting}
                        onClick={confirmDelete.prompt}
                    />
                )}
            </QuickActionsDropdown>

            {confirmResolve.pending && (
                <ConfirmationModal
                    open
                    onClose={confirmResolve.cancel}
                    onSubmit={confirmResolve.confirm}
                    title={c('Title').t`Mark as resolved?`}
                    submitText={c('Action').t`Confirm`}
                >
                    <Alert className="mb-4" type="info">
                        {c('Info')
                            .t`All current breaches will be marked as resolved. In case of future data breaches, you'll be notified.`}
                    </Alert>
                </ConfirmationModal>
            )}

            {confirmToggle.pending && (
                <ConfirmationModal
                    open
                    onClose={confirmToggle.cancel}
                    onSubmit={confirmToggle.confirm}
                    title={monitored ? c('Title').t`Pause monitoring?` : c('Title').t`Resume monitoring?`}
                    submitText={c('Action').t`Confirm`}
                >
                    <Alert className="mb-4" type="info">
                        {monitored
                            ? c('Info').t`You will no longer be notified of data breaches for this email address.`
                            : c('Info').t`You will be notified of data breaches for this email address.`}
                    </Alert>
                </ConfirmationModal>
            )}

            {confirmDelete.pending && (
                <ConfirmationModal
                    open
                    onClose={confirmDelete.cancel}
                    onSubmit={confirmDelete.confirm}
                    title={c('Title').t`Remove email address?`}
                    submitText={c('Action').t`Confirm`}
                    alertText={c('Warning').t`This email address will no longer be monitored for data breaches.`}
                />
            )}
        </div>
    );
};
