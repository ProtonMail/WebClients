import { c } from 'ttag';

import { ApiImportProvider, ApiSyncState } from '@proton/activation/src/api/api.interface';
import { ImportType } from '@proton/activation/src/interface';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { selectSyncByEmail } from '@proton/activation/src/logic/sync/sync.selectors';
import { Button } from '@proton/atoms/Button/Button';
import { TableCell, TableRow } from '@proton/components';
import useSettingsLink from '@proton/components/components/link/useSettingsLink';
import { APPS } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces';

import ReportsTableCell from '../ReportsTableCell';
import SyncRowStatus from './SyncRowStatus';

interface Props {
    address: Address;
}

export const BYOEAddressRow = ({ address }: Props) => {
    const goToSettings = useSettingsLink();

    const syncItem = useEasySwitchSelector((state) => selectSyncByEmail(state, address.Email));

    const isAddressDisconnected = !syncItem || syncItem.state !== ApiSyncState.ACTIVE;

    return (
        <TableRow data-testid="reportsTable:byoeAddressRow">
            <ReportsTableCell provider={ApiImportProvider.GOOGLE} product={ImportType.MAIL} title={address.Email} />
            <TableCell className="easy-switch-table-size">-</TableCell>
            <TableCell className="easy-switch-table-status">
                {!isAddressDisconnected ? (
                    <SyncRowStatus state={syncItem!.state} />
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
