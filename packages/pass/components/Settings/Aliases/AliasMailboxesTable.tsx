import { type FC, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Badge, Table, TableBody, TableCell, TableHeader, TableHeaderCell, TableRow } from '@proton/components/index';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { TableRowLoading } from '@proton/pass/components/Layout/Table/TableRowLoading';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { resendVerifyMailbox, setDefaultMailbox } from '@proton/pass/store/actions';
import type { MaybeNull, UserMailboxOutput } from '@proton/pass/types';

import { MailboxDeleteModal, type MailboxToDelete } from './MailboxDeleteModal';

type Props = {
    mailboxes: MaybeNull<UserMailboxOutput[]>;
    onVerify: (data: UserMailboxOutput) => void;
    onChangeDefault: (mailboxId: number) => void;
    onRemove: (mailboxId: number) => void;
};

export const AliasMailboxesTable: FC<Props> = ({ mailboxes, onVerify, onChangeDefault, onRemove }) => {
    const [mailboxToDelete, setMailboxToDelete] = useState<MaybeNull<MailboxToDelete>>(null);
    const filteredMailboxes = useMemo(
        () => mailboxes?.filter(({ MailboxID }) => MailboxID !== mailboxToDelete?.MailboxID) ?? [],
        [mailboxToDelete]
    );

    const setDefaultMailboxRequest = useRequest(setDefaultMailbox, {
        onSuccess: ({ data: { DefaultMailboxID } }) => onChangeDefault(DefaultMailboxID),
    });

    const resendVerification = useRequest(resendVerifyMailbox, {
        onSuccess: ({ data }) => onVerify(data),
    });

    return (
        <>
            <Table responsive="cards" hasActions>
                <TableHeader>
                    <TableRow>
                        <TableHeaderCell className="w-1/2">{c('Title').t`Mailbox`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Aliases`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Status`}</TableHeaderCell>
                        <TableHeaderCell>{c('Title').t`Actions`}</TableHeaderCell>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {mailboxes ? (
                        mailboxes.map(({ MailboxID, Email, Verified, IsDefault, AliasCount }) => (
                            <TableRow key={MailboxID}>
                                <TableCell className="text-cut">{Email}</TableCell>
                                <TableCell>{AliasCount}</TableCell>
                                <TableCell>
                                    {IsDefault ? (
                                        <Badge type="primary">{c('Title').t`Default`}</Badge>
                                    ) : (
                                        !Verified && (
                                            <Button
                                                shape="ghost"
                                                style={{ padding: 0 }}
                                                disabled={resendVerification.loading}
                                                onClick={() => resendVerification.dispatch(MailboxID)}
                                            >
                                                <Badge type="light" className="m-0">{c('Info').t`Unverified`}</Badge>
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
                                        >
                                            {!IsDefault && (
                                                <DropdownMenuButton
                                                    disabled={!Verified || setDefaultMailboxRequest.loading}
                                                    label={c('Action').t`Make default`}
                                                    onClick={() =>
                                                        setDefaultMailboxRequest.dispatch({
                                                            defaultMailboxID: MailboxID,
                                                        })
                                                    }
                                                    loading={setDefaultMailboxRequest.loading}
                                                />
                                            )}
                                            {!Verified && (
                                                <DropdownMenuButton
                                                    label={c('Action').t`Verify`}
                                                    disabled={resendVerification.loading}
                                                    onClick={() => resendVerification.dispatch(MailboxID)}
                                                />
                                            )}
                                            <DropdownMenuButton
                                                label={c('Action').t`Delete`}
                                                disabled={IsDefault || mailboxes.length === 1}
                                                onClick={() => setMailboxToDelete({ MailboxID, Email })}
                                            />
                                        </QuickActionsDropdown>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRowLoading rows={1} cells={4} />
                    )}
                </TableBody>
            </Table>
            {mailboxToDelete && (
                <MailboxDeleteModal
                    mailboxes={filteredMailboxes}
                    mailboxToDelete={mailboxToDelete}
                    onClose={() => setMailboxToDelete(null)}
                    onRemove={onRemove}
                />
            )}
        </>
    );
};
