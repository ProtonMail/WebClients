import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button, Icon } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorContext';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { MAX_CUSTOM_ADDRESSES } from '@proton/pass/constants';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getAddressId, intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { addCustomAddress } from '@proton/pass/store/actions';
import { addCustomAddressRequest, deleteCustomAddressRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

export const BreachGroupRowActions: FC<MonitorTableRow> = (row) => {
    const { onTelemetry } = usePassCore();
    const { breaches, deleteAddress, verifyAddress } = useMonitor();
    const { type, email } = row;

    const add = useRequest(addCustomAddress, {
        initialRequestId: addCustomAddressRequest(row.email),
        onSuccess: ({ data }) => verifyAddress(intoCustomMonitorAddress(data)),
    });

    const deleting = useSelector(selectRequestInFlight(deleteCustomAddressRequest(email)));
    const loading = add.loading || deleting;

    if (type === AddressType.CUSTOM) {
        if (row.suggestion) {
            return (
                <Button
                    className="shrink-0"
                    pill
                    shape="solid"
                    color="weak"
                    size="small"
                    onClick={(evt) => {
                        evt.stopPropagation();
                        add.dispatch(row.email);
                        onTelemetry(TelemetryEventName.PassMonitorAddCustomEmailFromSuggestion, {}, {});
                    }}
                    loading={add.loading}
                    disabled={breaches.data.custom.length >= MAX_CUSTOM_ADDRESSES}
                >
                    {c('Action').t`Add`}
                </Button>
            );
        }

        if (!row.verified) {
            return (
                <QuickActionsDropdown
                    icon="three-dots-vertical"
                    size="small"
                    shape="ghost"
                    className="shrink-0"
                    originalPlacement="bottom-start"
                    disabled={loading}
                >
                    <DropdownMenuButton
                        onClick={() => verifyAddress(row)}
                        label={c('Action').t`Verify`}
                        icon="envelope-open"
                    />
                    <DropdownMenuButton
                        onClick={() => deleteAddress(row.addressId)}
                        label={c('Action').t`Remove`}
                        icon="trash"
                        loading={deleting}
                    />
                </QuickActionsDropdown>
            );
        }
    }

    return (
        <Link
            className="shrink-0"
            to={getLocalPath(`monitor/dark-web/${row.type}/${getAddressId(row)}`)}
            onClick={(evt) => evt.stopPropagation()}
        >
            <Button pill size="small" shape="ghost" type="button">
                <Icon name="chevron-right" />
            </Button>
        </Link>
    );
};
