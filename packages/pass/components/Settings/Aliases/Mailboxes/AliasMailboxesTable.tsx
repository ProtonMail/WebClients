import { type FC } from 'react';

import { c } from 'ttag';

import { Table, TableBody, TableHeader, TableHeaderCell, TableRow } from '@proton/components';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';

import { AliasMailboxTableRow } from './AliasMailboxTableRow';
import { useAliasMailboxes } from './AliasMailboxesProvider';

export const AliasMailboxesTable: FC = () => {
    const { mailboxes, loading } = useAliasMailboxes();

    return (
        <Table responsive="cards" hasActions borderWeak>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/2">{c('Title').t`Mailbox`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Aliases`}</TableHeaderCell>
                    <TableHeaderCell className="w-1/5">
                        <span className="ml-4">{c('Title').t`Status`}</span>
                    </TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Actions`}</TableHeaderCell>
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
