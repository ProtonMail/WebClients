import { useEffect } from 'react';

import { c } from 'ttag';

import { useNonBYOESyncs } from '@proton/activation/src/hooks/useNonBYOESyncs';
import { loadDashboard } from '@proton/activation/src/logic/actions';
import { useEasySwitchDispatch } from '@proton/activation/src/logic/store';
import { Table, TableBody } from '@proton/components';

import SyncRow from './Sync/SyncRow';

export const SyncsTable = () => {
    const syncIdsArray = useNonBYOESyncs();
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
                .t`Forwarding automatically sends new incoming emails to your Inbox.`}</div>

            {syncIdsArray.length === 0 ? (
                <div className="color-weak">{c('Info').t`No forwarding history.`}</div>
            ) : (
                <Table
                    hasActions
                    responsive="cards"
                    className="simple-table--border-weak simple-table--border-lines-rounded easy-switch-table"
                >
                    <TableBody>
                        {syncIdsArray.map((id) => (
                            <SyncRow key={id} syncId={id} />
                        ))}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
