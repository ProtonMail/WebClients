import type { FC } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';

import { MAX_CUSTOM_ADDRESSES } from '../../../../constants';
import type { MonitorTableRow } from '../../../../hooks/monitor/useBreachesTable';
import { useRequest } from '../../../../hooks/useRequest';
import { getAddressId, intoCustomMonitorAddress } from '../../../../lib/monitor/monitor.utils';
import { AddressType } from '../../../../lib/monitor/types';
import { addCustomAddress, deleteCustomAddress } from '../../../../store/actions';
import { selectRequestInFlight } from '../../../../store/selectors';
import { TelemetryEventName } from '../../../../types/data/telemetry';
import { usePassCore } from '../../../Core/PassCoreProvider';
import { DropdownMenuButton } from '../../../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../../../Layout/Dropdown/QuickActionsDropdown';
import { getLocalPath } from '../../../Navigation/routing';
import { useMonitor } from '../../MonitorContext';

export const BreachGroupRowActions: FC<MonitorTableRow> = (row) => {
    const { onTelemetry } = usePassCore();
    const { breaches, deleteAddress, verifyAddress } = useMonitor();
    const { type, email } = row;

    const add = useRequest(addCustomAddress, {
        initial: row.email,
        onSuccess: (address) => verifyAddress(intoCustomMonitorAddress(address)),
    });

    const deleting = useSelector(selectRequestInFlight(deleteCustomAddress.requestID(email)));
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
                <IcChevronRight />
            </Button>
        </Link>
    );
};
