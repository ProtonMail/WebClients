import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { Option, SelectTwo } from '@proton/components';
import { useRequest } from '@proton/pass/hooks/useActionRequest';
import { getMailboxes } from '@proton/pass/store/actions';
import type { CustomDomainMailboxOutput, MaybeNull, UserMailboxOutput } from '@proton/pass/types';

const intoCustomDomainMailbox = (mailboxes: UserMailboxOutput): CustomDomainMailboxOutput => {
    return {
        Email: mailboxes.Email,
        ID: mailboxes.MailboxID,
    };
};

type Props = {
    values: number[];
    disabled?: boolean;
    onChange: (mailboxIDs: number[]) => void;
};

export const DomainMailboxesSelector = ({ onChange, values, disabled }: Props) => {
    const [mailboxes, setMailboxes] = useState<MaybeNull<CustomDomainMailboxOutput[]>>(null);

    const getAllMailboxes = useRequest(getMailboxes, {
        onSuccess: ({ data }) => setMailboxes(data.filter(({ Verified }) => Verified).map(intoCustomDomainMailbox)),
    });

    useEffect(getAllMailboxes.dispatch, []);

    return (
        <SelectTwo<number[]>
            placeholder={c('Label').t`Select an email address`}
            onValue={onChange}
            value={values}
            disabled={disabled}
            loading={getAllMailboxes.loading}
            multiple
        >
            {mailboxes
                ? mailboxes.map((mailbox) => (
                      <Option value={mailbox.ID} title={mailbox.Email} key={mailbox.ID}>
                          {mailbox.Email}
                      </Option>
                  ))
                : []}
        </SelectTwo>
    );
};
