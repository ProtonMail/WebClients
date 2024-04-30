import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { useResolveBreach } from '@proton/pass/hooks/monitor/useResolveBreach';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getAddressId } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType, type MonitorAddress } from '@proton/pass/lib/monitor/types';
import { toggleAddressMonitor } from '@proton/pass/store/actions';
import { deleteCustomAddressRequest, toggleAddressMonitorRequest } from '@proton/pass/store/actions/requests';
import { selectMonitorSettingByType, selectRequestInFlight } from '@proton/pass/store/selectors';

type Props = { resolved: boolean; disabled: boolean } & MonitorAddress;
export const BreachActions: FC<Props> = ({ resolved, disabled, ...address }) => {
    const { monitored, type, email } = address;
    const monitor = useMonitor();

    const groupMonitored = useSelector(selectMonitorSettingByType(type));
    const deleting = useSelector(selectRequestInFlight(deleteCustomAddressRequest(email)));

    const { resolve, loading } = useResolveBreach(address);
    const initialRequestId = toggleAddressMonitorRequest(getAddressId(address));
    const toggle = useRequest(toggleAddressMonitor, { initialRequestId });

    return (
        <div className="flex flex-nowrap gap-2">
            {!resolved && (
                <Button pill shape="solid" color="weak" onClick={resolve} loading={loading}>
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
                    onClick={() => toggle.dispatch({ ...address, monitor: !monitored })}
                />
                {address.type === AddressType.CUSTOM && (
                    <DropdownMenuButton
                        icon="trash"
                        label={c('Action').t`Remove`}
                        loading={deleting}
                        onClick={() => monitor.deleteAddress(getAddressId(address))}
                    />
                )}
            </QuickActionsDropdown>
        </div>
    );
};
