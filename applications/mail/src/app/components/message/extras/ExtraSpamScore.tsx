import { MESSAGE_FLAGS } from 'proton-shared/lib/mail/constants';
import React from 'react';
import { Icon, Href } from 'react-components';
import { c } from 'ttag';
import { hasBit } from 'proton-shared/lib/helpers/bitset';

import { MessageExtended } from '../../../models/message';

interface Props {
    message: MessageExtended;
}

const ExtraSpamScore = ({ message }: Props) => {
    const { Flags } = message.data || {};

    if (hasBit(Flags, MESSAGE_FLAGS.FLAG_DMARC_FAIL)) {
        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="spam" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info')
                    .t`This email has failed its domain's authentication requirements. It may be spoofed or improperly forwarded!`}</span>
                <span className="flex-item-noshrink flex">
                    <Href
                        className="underline color-currentColor"
                        url="https://protonmail.com/support/knowledge-base/email-has-failed-its-domains-authentication-requirements-warning/"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
        );
    }

    if (hasBit(Flags, MESSAGE_FLAGS.FLAG_PHISHING_AUTO)) {
        return (
            <div className="bg-global-warning color-white rounded p0-5 mb0-5 flex flex-nowrap">
                <Icon name="spam" className="flex-item-noshrink mtauto mbauto" />
                <span className="pl0-5 pr0-5 flex-item-fluid">{c('Info')
                    .t`This message may be a phishing attempt. Please check the sender and contents to make sure they are legitimate.`}</span>
                <span className="flex-item-noshrink flex">
                    <Href
                        className="mr1 pl0-5 pr0-5 color-white"
                        url="https://protonmail.com/blog/prevent-phishing-attacks/"
                    >
                        {c('Info').t`Learn more`}
                    </Href>
                </span>
            </div>
        );
    }

    return null;
};

export default ExtraSpamScore;
