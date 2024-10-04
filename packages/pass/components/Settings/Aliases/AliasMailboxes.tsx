import { type FC, useEffect, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/index';
import { AliasMailboxesTable } from '@proton/pass/components/Settings/Aliases/AliasMailboxesTable';
import { MailboxAddModal } from '@proton/pass/components/Settings/Aliases/MailboxAddModal';
import { MailboxVerifyModal } from '@proton/pass/components/Settings/Aliases/MailboxVerifyModal';
import { SettingsPanel } from '@proton/pass/components/Settings/SettingsPanel';
import { useActionRequest } from '@proton/pass/hooks/useActionRequest';
import { getMailboxes } from '@proton/pass/store/actions';
import type { MaybeNull, UserMailboxOutput } from '@proton/pass/types';
import { getEpoch } from '@proton/pass/utils/time/epoch';

export type MailboxActionVerify = UserMailboxOutput & { sentAt: number };

type MailboxAction = { type: 'add' } | ({ type: 'verify' } & MailboxActionVerify);

export const AliasMailboxes: FC = () => {
    const [mailboxes, setMailboxes] = useState<MaybeNull<UserMailboxOutput[]>>(null);
    const [action, setAction] = useState<MaybeNull<MailboxAction>>(null);
    const getAllMailboxes = useActionRequest(getMailboxes.intent, { onSuccess: ({ data }) => setMailboxes(data) });

    const handleAddMailboxClick = () => setAction({ type: 'add' });

    const handleRemoved = (mailboxId: number) =>
        setMailboxes((prevState) => prevState?.filter((item) => item.MailboxID !== mailboxId) ?? null);

    const handleChangeDefaultMailbox = (mailboxId: number) =>
        setMailboxes(
            (prevState) =>
                prevState?.map((item) => ({
                    ...item,
                    // Remove the current default and set the new one
                    IsDefault: item.IsDefault ? false : item.MailboxID === mailboxId,
                })) ?? null
        );

    const handleResendVerify = (data: UserMailboxOutput) => setAction({ type: 'verify', sentAt: getEpoch(), ...data });

    const handleMailboxVerified = (mailbox: UserMailboxOutput) => {
        setMailboxes(
            (prevState) => prevState?.map((item) => (item.MailboxID === mailbox.MailboxID ? mailbox : item)) ?? null
        );
    };

    const handleMailboxAdded = (data: MailboxActionVerify) => {
        setMailboxes((mailboxes) => [...(mailboxes ?? []), data]);
        setAction({ type: 'verify', ...data });
    };

    useEffect(getAllMailboxes.dispatch, []);

    return (
        <SettingsPanel title={c('Label').t`Mailboxes`}>
            <div>{c('Info')
                .t`Emails sent to your aliases are forwarded to your mailboxes. An alias can have more than one mailbox: useful to share an alias between you and your friends.`}</div>

            <Button color="weak" shape="solid" className="w-1/6 my-2" onClick={handleAddMailboxClick}>{c('Action')
                .t`Add mailbox`}</Button>

            <AliasMailboxesTable
                mailboxes={mailboxes}
                onVerify={handleResendVerify}
                onChangeDefault={handleChangeDefaultMailbox}
                onRemove={handleRemoved}
            />

            {action?.type === 'add' && (
                <MailboxAddModal onClose={() => setAction(null)} onSubmit={handleMailboxAdded} />
            )}

            {action?.type === 'verify' && (
                <MailboxVerifyModal
                    onClose={() => setAction(null)}
                    email={action.Email}
                    mailboxID={action.MailboxID}
                    sentAt={action.sentAt}
                    onSubmit={handleMailboxVerified}
                />
            )}
        </SettingsPanel>
    );
};
