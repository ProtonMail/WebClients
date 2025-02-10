import { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import { Alert, DropdownSizeUnit, Option, SelectTwo } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { useRequest } from '@proton/pass/hooks/useRequest';
import { mailboxVerificationRequired } from '@proton/pass/lib/alias/alias.utils';
import { deleteMailbox } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { mailboxID: number; aliasCount: number };

export const AliasMailboxDeleteModal: FC<Props> = ({ mailboxID, aliasCount = 0 }) => {
    const { mailboxes, onDelete, setAction } = useAliasMailboxes();
    const onClose = () => setAction(null);

    const { mailbox, remaining } = useMemo(
        () => ({
            mailbox: mailboxes.find((mailbox) => mailbox.MailboxID === mailboxID),
            remaining: mailboxes.filter(
                (mailbox) => mailbox.MailboxID !== mailboxID && !mailboxVerificationRequired(mailbox)
            ),
        }),
        [mailboxID, mailboxes]
    );

    const hasAlias = aliasCount > 0;

    const defaultMailboxID = useMemo(() => (remaining.find(prop('IsDefault')) ?? remaining[0]).MailboxID, [remaining]);
    const [transferMailboxID, setTransferMailboxID] = useState<MaybeNull<number>>(
        mailbox?.Verified && hasAlias ? defaultMailboxID : null
    );
    const transferAliases = transferMailboxID !== null;
    const removeMailbox = useRequest(deleteMailbox, {
        onSuccess: pipe(() => onDelete(mailboxID, transferAliases), onClose),
    });

    const emailJSX = <strong key="email-to-delete">{mailbox?.Email}</strong>;

    useEffect(() => {
        if (!mailbox) onClose();
    }, [mailbox]);

    return (
        mailbox && (
            <ConfirmationModal
                open
                title={c('Title').t`Delete mailbox`}
                submitText={
                    transferMailboxID ? c('Action').t`Transfer and delete mailbox` : c('Action').t`Delete mailbox`
                }
                size="medium"
                onClose={onClose}
                onSubmit={() => removeMailbox.dispatch({ mailboxID, transferMailboxID })}
                closeAfterSubmit={false}
                disabled={removeMailbox.loading}
            >
                {hasAlias ? (
                    <>
                        <p className="mb-2">{c('Info')
                            .jt`All aliases using the mailbox ${emailJSX} will be also deleted.`}</p>
                        <p className="mt-2">{c('Info')
                            .t`To keep receiving emails transfer these aliases to a different mailbox:`}</p>

                        <div className="my-6 mx-4">
                            <InlineFieldBox
                                label={
                                    <div>
                                        {c('Action').t`Transfer aliases`}
                                        {!transferAliases && (
                                            <Alert className="mt-2 text-sm" type="error">
                                                {c('Warning')
                                                    .t`Please note that once deleted, aliases can't be restored`}
                                            </Alert>
                                        )}
                                    </div>
                                }
                            >
                                <Toggle
                                    checked={transferAliases}
                                    disabled={removeMailbox.loading}
                                    onChange={() => setTransferMailboxID(transferAliases ? null : defaultMailboxID)}
                                />
                            </InlineFieldBox>
                            <hr className="mt-3" />
                            <InlineFieldBox label={c('Action').t`To mailbox`} size="md">
                                <SelectTwo
                                    value={transferMailboxID ?? defaultMailboxID}
                                    onChange={({ value }) => setTransferMailboxID(value)}
                                    disabled={!transferAliases || removeMailbox.loading}
                                    size={{ width: DropdownSizeUnit.Dynamic }}
                                >
                                    {remaining.map(({ MailboxID, Email }) => (
                                        <Option key={MailboxID} value={MailboxID} title={Email}>
                                            {Email}
                                        </Option>
                                    ))}
                                </SelectTwo>
                            </InlineFieldBox>
                        </div>
                    </>
                ) : (
                    <p>{c('Info').jt`Are you sure you want to remove ${emailJSX} from your mailboxes?`}</p>
                )}
            </ConfirmationModal>
        )
    );
};
