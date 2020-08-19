import React from 'react';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { c } from 'ttag';

import { INSECURE_DOMAINS } from './constants';
import InsecureEmailIcon from './InsecureEmailIcon';

interface Props {
    email: string;
}

const InsecureEmailInfo = ({ email }: Props) => {
    if (!validateEmailAddress(email)) {
        return null;
    }

    const [, domain = ''] = email.trim().toLowerCase().split('@');

    if (INSECURE_DOMAINS.includes(domain)) {
        return (
            <div className="mb1 flex flex-nowrap flex-items-center">
                <span className="mr0-5">{c('Title').t`This email may be insecure`}</span>
                <InsecureEmailIcon email={email} />
            </div>
        );
    }

    return null;
};

export default InsecureEmailInfo;
