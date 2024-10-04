import { type FC, useState } from 'react';

import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { DropdownSizeUnit, Option, SelectTwo } from '@proton/components/index';
import { ConfirmationModal } from '@proton/pass/components/Confirmation/ConfirmationModal';
import { InlineFieldBox } from '@proton/pass/components/Form/Field/Layout/InlineFieldBox';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { deleteMailbox } from '@proton/pass/store/actions';
import type { UserMailboxOutput } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

export type MailboxToDelete = Pick<UserMailboxOutput, 'MailboxID' | 'Email'>;

type Props = {
    mailboxToDelete: MailboxToDelete;
    mailboxes: UserMailboxOutput[];
    onClose: () => void;
    onRemove: (mailboxId: number) => void;
};

type MailboxDeleteOptions = { transferAliases: boolean; aliasToTransfer: number };

export const MailboxDeleteModal: FC<Props> = ({ mailboxToDelete, mailboxes, onClose, onRemove }) => {
    const [{ transferAliases, aliasToTransfer }, setOptions] = useState<MailboxDeleteOptions>({
        transferAliases: true,
        aliasToTransfer: mailboxes[0].MailboxID,
    });

    // Need to close it manually since the component unmounts when modal is submitted
    const deleteMailboxRequest = useRequest(deleteMailbox, {
        onSuccess: pipe(() => onRemove(mailboxToDelete.MailboxID), onClose),
    });

    const onSubmit = () =>
        deleteMailboxRequest.dispatch({
            mailboxID: mailboxToDelete.MailboxID,
            transferMailboxID: transferAliases ? aliasToTransfer : null,
        });

    const boldEmailText = <strong key="email-to-delete">{mailboxToDelete.Email}</strong>;

    return (
        <ConfirmationModal
            open
            title={c('Title').t`Delete mailbox`}
            submitText={transferAliases ? c('Action').t`Transfer and delete mailbox` : c('Action').t`Delete mailbox`}
            size="medium"
            onClose={onClose}
            onSubmit={onSubmit}
            closeAfterSubmit={false}
            disabled={deleteMailboxRequest.loading}
        >
            <p>{c('Info').jt`All aliases using the mailbox ${boldEmailText} will be also deleted.`}</p>
            <p>{c('Info').t`To keep receiving emails transfer these aliases to a different mailbox:`}</p>
            <div className="m-4">
                <InlineFieldBox label={c('Action').t`Transfer aliases`}>
                    <Toggle
                        checked={transferAliases}
                        disabled={deleteMailboxRequest.loading}
                        onChange={() => setOptions((options) => ({ ...options, transferAliases: !transferAliases }))}
                    />
                </InlineFieldBox>
                <hr className="mt-4" />
                <InlineFieldBox label={c('Action').t`To mailbox`} size="md">
                    <SelectTwo
                        className="bg-weak border-none"
                        color="weak"
                        value={aliasToTransfer}
                        onChange={({ value }) => setOptions((options) => ({ ...options, aliasToTransfer: value }))}
                        disabled={!transferAliases || deleteMailboxRequest.loading}
                        size={{ width: DropdownSizeUnit.Dynamic }}
                    >
                        {mailboxes.map(({ MailboxID, Email }) => (
                            <Option key={MailboxID} value={MailboxID} title={Email}>
                                {Email}
                            </Option>
                        ))}
                    </SelectTwo>
                </InlineFieldBox>
            </div>
        </ConfirmationModal>
    );
};
