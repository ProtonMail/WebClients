import { useEffect } from 'react';

import { c } from 'ttag';

import { Table, TableBody } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { EASY_SWITCH_TABLE_CLASS_NAME } from '../../constants';
import { useSyncsTableRows } from '../../hooks/useSyncsTableRows';
import { loadDashboard } from '../../logic/actions';
import { useEasySwitchDispatch } from '../../logic/store';
import { BYOEAddressRow } from './Sync/BYOEAddressRow';
import SyncRow from './Sync/SyncRow';

export const SyncsTable = () => {
    const { byoeAddresses, otherSyncs } = useSyncsTableRows();
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

            {otherSyncs.length === 0 && byoeAddresses.length === 0 ? (
                <div className="color-weak">{c('Info').t`No connected addresses.`}</div>
            ) : (
                <Table hasActions responsive="cards" className={EASY_SWITCH_TABLE_CLASS_NAME}>
                    <TableBody>
                        {byoeAddresses.map(({ address, sync }) => (
                            <BYOEAddressRow key={address.Email} address={address} sync={sync} />
                        ))}
                        {otherSyncs.map((sync) => (
                            <SyncRow key={sync.id} sync={sync} />
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
