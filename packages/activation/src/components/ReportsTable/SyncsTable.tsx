import { useEffect } from 'react';

import { c } from 'ttag';

import { Table, TableBody } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { useBYOEAddresses } from '../../hooks/useBYOEAddresses';
import { useNonBYOESyncs } from '../../hooks/useNonBYOESyncs';
import { loadDashboard } from '../../logic/actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { BYOEAddressRow } from './Sync/BYOEAddressRow';
import SyncRow from './Sync/SyncRow';

export const SyncsTable = () => {
    const nonBYOESyncIds = useNonBYOESyncs();
    const byoeAddresses = useBYOEAddresses();
    const dispatch = useEasySwitchDispatch();

    useEffect(() => {
        const request = dispatch(loadDashboard());
        return () => {
            request.abort();
        };
    }, []);

    return (
        <>
            <div className="mb-2 color-weak">{c('Info')
                .t`Connect and manage your external mailboxes in ${MAIL_APP_NAME}.`}</div>

            {nonBYOESyncIds.length === 0 && byoeAddresses.length === 0 ? (
                <div className="color-weak">{c('Info').t`No connected addresses.`}</div>
            ) : (
                <Table
                    hasActions
                    responsive="cards"
                    className="simple-table--border-weak simple-table--border-lines-rounded easy-switch-table"
                >
                    <TableBody>
                        {byoeAddresses.map((address) => (
                            <BYOEAddressRow key={address.Email} address={address} />
                        ))}
                        {nonBYOESyncIds.map((id) => (
                            <SyncRow key={id} syncId={id} />
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
