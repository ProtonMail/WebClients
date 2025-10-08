import { useEffect, useMemo } from 'react';

import { c } from 'ttag';

import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { mailboxVerificationRequired } from '@proton/pass/lib/alias/alias.utils';

import { useAliasMailboxes } from './AliasMailboxesProvider';

type Props = {
    values: number[];
    disabled?: boolean;
    onChange: (mailboxIDs: number[]) => void;
};

export const DomainMailboxesSelector = ({ onChange, values, disabled }: Props) => {
    const { getAliasMailboxes, mailboxes, loading } = useAliasMailboxes();
    const options = useMemo(() => mailboxes.filter((mailbox) => !mailboxVerificationRequired(mailbox)), [mailboxes]);

    useEffect(getAliasMailboxes, []);

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
