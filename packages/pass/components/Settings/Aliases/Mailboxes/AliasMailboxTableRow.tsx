import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';
import Badge from '@proton/components/components/badge/Badge';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { useAsyncRequestDispatch } from '@proton/pass/hooks/useDispatchAsyncRequest';
import { deleteMailbox, setDefaultMailbox } from '@proton/pass/store/actions';
import type { UserMailboxOutput } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { AliasMailboxLoading } from './AliasMailboxLoading';
import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { canDelete: boolean; mailbox: UserMailboxOutput };

export const AliasMailboxTableRow: FC<Props> = ({ canDelete, mailbox }) => {
    const dispatch = useAsyncRequestDispatch();
    const { setAction, onMailboxRemoved } = useAliasMailboxes();
    const { IsDefault, Verified, PendingEmail, MailboxID: mailboxID, Email, AliasCount } = mailbox;
    const verificationRequired = Boolean(!Verified || PendingEmail);

    return (
        <AliasMailboxLoading mailboxID={mailboxID} key={mailboxID}>
            {(loading) => (
                <TableRow className={clsx(loading && 'pointer-events-none', 'relative')}>
                    <TableCell label={c('Title').t`Mailbox`}>
                        <div className="flex items-center gap-2 flex-nowrap">
                            <div>
                                <span className={clsx('block text-ellipsis', PendingEmail && 'color-weak')}>
                                    {Email}
                                </span>
                                {PendingEmail && (
                                    <span className="block text-ellipsis">
                                        {'→ '}
                                        <span className="">{PendingEmail}</span>
                                    </span>
                                )}
                            </div>
                            {loading && <CircleLoader size="tiny" className="shrink-0" />}
                        </div>
                    </TableCell>
                    <TableCell label={c('Title').t`Aliases`}>{AliasCount}</TableCell>
                    <TableCell className="pass-mailboxes-table--status">
                        <div className="flex justify-start gap-1">
                            {IsDefault && (
                                <Badge type="primary" className="text-center shrink-0">
                                    <span className="text-ellipsis">{c('Title').t`Default`}</span>
                                </Badge>
                            )}
                            {verificationRequired && (
                                <Button
                                    shape="ghost"
                                    className="pass-mailboxes-table--badge-btn"
                                    onClick={() => setAction({ type: 'verify', mailboxID })}
                                >
                                    <Badge type="light" className="w-full">
                                        <span className="text-ellipsis">{c('Info').t`Unverified`}</span>
                                    </Badge>
                                </Button>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="pass-mailboxes-table--actions">
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
                                iconSize={4}
                            >
                                {!IsDefault && (
                                    <DropdownMenuButton
                                        disabled={!Verified || loading}
                                        label={c('Action').t`Make default`}
                                        onClick={() => dispatch(setDefaultMailbox, { mailboxID })}
                                    />
                                )}

                                {verificationRequired && (
                                    <DropdownMenuButton
                                        label={c('Action').t`Verify`}
                                        onClick={() => setAction({ type: 'verify', mailboxID })}
                                    />
                                )}

                                {PendingEmail ? (
                                    <DropdownMenuButton
                                        label={c('Action').t`Cancel email change`}
                                        onClick={() => setAction({ type: 'cancel-edit', mailboxID })}
                                    />
                                ) : (
                                    <DropdownMenuButton
                                        label={c('Action').t`Change email`}
                                        onClick={() => setAction({ type: 'edit', mailboxID })}
                                    />
                                )}

                                <DropdownMenuButton
                                    label={c('Action').t`Delete`}
                                    disabled={IsDefault || !canDelete}
                                    onClick={() =>
                                        Verified
                                            ? setAction({ type: 'delete', mailboxID })
                                            : dispatch(deleteMailbox, { mailboxID })
                                                  .then((res) => res.type === 'success' && onMailboxRemoved(res.data))
                                                  .catch(noop)
                                    }
                                />
                            </QuickActionsDropdown>
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </AliasMailboxLoading>
    );
};
