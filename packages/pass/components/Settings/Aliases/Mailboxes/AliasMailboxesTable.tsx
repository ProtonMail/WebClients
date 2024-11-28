import { type FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/index';
import { Badge, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components/index';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import { AliasMailboxLoading } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxLoading';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { setDefaultMailbox } from '@proton/pass/store/actions';
import clsx from '@proton/utils/clsx';

import { useAliasMailboxes } from './AliasMailboxesProvider';

export const AliasMailboxesTable: FC = () => {
    const { canManage, mailboxes, loading, onSetDefault, setAction } = useAliasMailboxes();
    const handleVerifyClick = (mailboxID: number) => setAction({ type: 'verify', mailboxID });

    const setDefault = useRequest(setDefaultMailbox, {
        onSuccess: ({ DefaultMailboxID }) => onSetDefault(DefaultMailboxID),
    });

    return (
        <Table responsive="cards" hasActions borderWeak>
            <TableHeader>
                <TableRow>
                    <TableHeaderCell className="w-1/2">{c('Title').t`Mailbox`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Aliases`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Status`}</TableHeaderCell>
                    <TableHeaderCell>{c('Title').t`Actions`}</TableHeaderCell>
                </TableRow>
            </TableHeader>
            <TableBody>
                {loading ? (
                    <TableRowLoading rows={1} cells={4} />
                ) : (
                    mailboxes.map(({ MailboxID, Email, Verified, IsDefault, AliasCount }) => (
                        <AliasMailboxLoading mailboxID={MailboxID} key={MailboxID}>
                            {(loading) => (
                                <TableRow key={MailboxID} className={clsx(loading && 'pointer-events-none')}>
                                    <TableCell>
                                        <div className="flex items-center gap-2 flex-nowrap">
                                            <span className="block text-ellipsis">{Email}</span>
                                            {loading && <CircleLoader size="tiny" className="shrink-0" />}
                                        </div>
                                    </TableCell>
                                    <TableCell>{AliasCount}</TableCell>
                                    <TableCell>
                                        {IsDefault ? (
                                            <Badge type="primary">{c('Title').t`Default`}</Badge>
                                        ) : (
                                            !Verified && (
                                                <Button
                                                    shape="ghost"
                                                    style={{ padding: 0 }}
                                                    onClick={() => handleVerifyClick(MailboxID)}
                                                >
                                                    <Badge type="light" className="m-0">{c('Info')
                                                        .t`Unverified`}</Badge>
                                                </Button>
                                            )
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <QuickActionsDropdown
                                                icon="three-dots-horizontal"
                                                color="weak"
                                                shape="solid"
                                                size="small"
                                                className="button-xs ui-purple"
                                                pill={false}
                                                originalPlacement="bottom-end"
                                                disabled={loading}
                                            >
                                                {!IsDefault && (
                                                    <DropdownMenuButton
                                                        disabled={!canManage || !Verified || setDefault.loading}
                                                        label={c('Action').t`Make default`}
                                                        onClick={() =>
                                                            setDefault.dispatch({ defaultMailboxID: MailboxID })
                                                        }
                                                        loading={setDefault.loading}
                                                    />
                                                )}
                                                {!Verified && (
                                                    <DropdownMenuButton
                                                        label={c('Action').t`Verify`}
                                                        onClick={() => handleVerifyClick(MailboxID)}
                                                        disabled={!canManage}
                                                    />
                                                )}
                                                <DropdownMenuButton
                                                    label={c('Action').t`Delete`}
                                                    disabled={IsDefault || mailboxes.length === 1}
                                                    onClick={() => setAction({ type: 'delete', mailboxID: MailboxID })}
                                                />
                                            </QuickActionsDropdown>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </AliasMailboxLoading>
                    ))
                )}
            </TableBody>
        </Table>
    );
};
