import type { FC } from 'react';

import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableHeaderCell from '@proton/components/components/table/TableHeaderCell';
import TableRow from '@proton/components/components/table/TableRow';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';

import { AliasMailboxTableRow } from './AliasMailboxTableRow';
import { useAliasMailboxes } from './AliasMailboxesProvider';

import './AliasMailboxesTable.scss';

export const AliasMailboxesTable: FC = () => {
    const { mailboxes, loading } = useAliasMailboxes();

    return (
        <Table responsive="cards" hasActions borderWeak className="pass-mailboxes-table">
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-4/10">{c('Title').t`Mailbox`}</TableHeaderCell>
                    <TableHeaderCell className="w-2/10">{c('Title').t`Aliases`}</TableHeaderCell>
                    <TableHeaderCell className="w-3/10">{c('Title').t`Status`}</TableHeaderCell>
                    <TableHeaderCell className="w-1/10">{c('Title').t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRowLoading rows={1} cells={4} />
                ) : (
                    mailboxes.map((mailbox) => (
                        <AliasMailboxTableRow
                            key={mailbox.MailboxID}
                            canDelete={mailboxes.length > 1}
                            mailbox={mailbox}
                        />
                    ))
                )}
            </TableBody>
        </Table>
    );
};
