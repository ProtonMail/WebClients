import { useEffect, useMemo } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useAliasMailboxes } from '@proton/pass/components/Settings/Aliases/Mailboxes/AliasMailboxesProvider';
import { mailboxVerificationRequired } from '@proton/pass/lib/alias/alias.utils';

type Props = {
    values: number[];
    disabled?: boolean;
    onChange: (mailboxIDs: number[]) => void;
};

export const DomainMailboxesSelector = ({ onChange, values, disabled }: Props) => {
    const { getMailboxes, mailboxes, loading } = useAliasMailboxes();

    useEffect(getMailboxes, []);

    const options = useMemo(() => mailboxes.filter((mailbox) => !mailboxVerificationRequired(mailbox)), [mailboxes]);

    return (
        <SelectTwo<number[]>
            placeholder={c('Label').t`Select an email address`}
            onValue={onChange}
            value={values}
            disabled={disabled}
            loading={loading}
            multiple
        >
            {options.map((mailbox) => (
                <Option value={mailbox.MailboxID} title={mailbox.Email} key={mailbox.MailboxID}>
                    {mailbox.Email}
                </Option>
            ))}
        </SelectTwo>
    );
};
