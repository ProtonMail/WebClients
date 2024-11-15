import { type FC, useEffect, useMemo, useState } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { DropdownSizeUnit, Option, SelectTwo } from '@proton/components/index';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { deleteMailbox } from '@proton/pass/store/actions';
import type { MaybeNull } from '@proton/pass/types';
import { prop } from '@proton/pass/utils/fp/lens';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = { mailboxID: number; onClose: () => void };

export const AliasMailboxDeleteModal: FC<Props> = ({ mailboxID, onClose }) => {
    const { mailboxes, onDelete } = useAliasMailboxes();

    const { mailbox, remaining } = useMemo(
        () => ({
            mailbox: mailboxes.find((mailbox) => mailbox.MailboxID === mailboxID),
            remaining: mailboxes.filter((mailbox) => mailbox.MailboxID !== mailboxID && mailbox.Verified),
        }),
        [mailboxID, mailboxes]
    );

    const defaultMailboxID = useMemo(() => (remaining.find(prop('IsDefault')) ?? remaining[0]).MailboxID, [remaining]);
    const [transferMailboxID, setTransferMailboxID] = useState<MaybeNull<number>>(
        mailbox?.Verified ? defaultMailboxID : null
    );
    const transferAliases = transferMailboxID !== null;
    const removeMailbox = useRequest(deleteMailbox, { onSuccess: pipe(() => onDelete(mailboxID), onClose) });

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
                {mailbox.Verified ? (
                    <>
                        <p>{c('Info').jt`All aliases using the mailbox ${emailJSX} will be also deleted.`}</p>
                        <p>{c('Info').t`To keep receiving emails transfer these aliases to a different mailbox:`}</p>
                        <div className="m-4">
                            <InlineFieldBox label={c('Action').t`Transfer aliases`}>
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
