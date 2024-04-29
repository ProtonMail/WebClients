import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon } from '@proton/components/components/icon';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useMonitor } from '@proton/pass/components/Monitor/MonitorProvider';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import type { MonitorTableRow } from '@proton/pass/hooks/monitor/useBreachesTable';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getAddressId, intoCustomMonitorAddress } from '@proton/pass/lib/monitor/monitor.utils';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { addCustomAddress } from '@proton/pass/store/actions';
import { addCustomAddressRequest, deleteCustomAddressRequest } from '@proton/pass/store/actions/requests';
import { selectRequestInFlight } from '@proton/pass/store/selectors';

export const BreachGroupRowActions: FC<MonitorTableRow> = (row) => {
    const { type, email, monitored, verified } = row;
    const monitor = useMonitor();

    const add = useRequest(addCustomAddress, {
        initialRequestId: addCustomAddressRequest(row.email),
        onSuccess: ({ data }) => monitor.verifyAddress(intoCustomMonitorAddress(data)),
    });

    const deleting = useSelector(selectRequestInFlight(deleteCustomAddressRequest(email)));
    const loading = add.loading || deleting;

    if (type === AddressType.CUSTOM) {
        if (!monitored) {
            return (
                <Button
                    className="shrink-0"
                    pill
                    shape="solid"
                    color="weak"
                    size="small"
                    onClick={() => add.dispatch(row.email)}
                    loading={add.loading}
                >
                    {c('Action').t`Add`}
                </Button>
            );
        }

        if (!verified) {
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
                        onClick={() => monitor.verifyAddress(row)}
                        label={c('Label').t`Verify`}
                        icon="envelope-open"
                    />
                    <DropdownMenuButton
                        onClick={() => monitor.deleteAddress(row.addressId)}
                        label={c('Label').t`Remove`}
                        icon="trash"
                        loading={deleting}
                    />
                </QuickActionsDropdown>
            );
        }
    }

    return (
        <Link className="shrink-0" to={getLocalPath(`monitor/dark-web/${row.type}/${getAddressId(row)}`)}>
            <Button pill size="small" shape="ghost" type="button">
                <Icon name="chevron-right" />
            </Button>
        </Link>
    );
};
