import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { TableCell, TableRow } from '@proton/components';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { APPS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import { ApiImportProvider, ApiSyncState } from '../../../api/api.interface';
import { ImportType } from '../../../interface';
import type { Sync } from '../../../logic/sync/sync.interface';
import ReportsTableCell from '../ReportsTableCell';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    address: Address;
    sync: Sync | undefined;
}

export const BYOEAddressRow = ({ address, sync }: Props) => {
    const goToSettings = useSettingsLink();

    const isAddressDisconnected = !sync || sync.state !== ApiSyncState.ACTIVE;

    return (
        <TableRow data-testid="reportsTable:byoeAddressRow">
            <ReportsTableCell provider={ApiImportProvider.GOOGLE} product={ImportType.MAIL} title={address.Email} />
            <TableCell className="easy-switch-table-size">-</TableCell>
            <TableCell className="easy-switch-table-status">
                {!isAddressDisconnected ? (
                    <SyncRowStatus state={sync!.state} />
                ) : (
                    <span className="color-weak">{c('Address status').t`Disconnected`}</span>
                )}
            </TableCell>
            <TableCell className="easy-switch-table-actions">
                <Button
                    onClick={() => {
                        goToSettings('/identity-addresses#addresses', APPS.PROTONMAIL);
                    }}
                >
                    {c('Action').t`Manage addresses`}
                </Button>
            </TableCell>
        </TableRow>
    );
};
