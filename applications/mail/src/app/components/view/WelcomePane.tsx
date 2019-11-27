import React from 'react';
import { useUser, useModals, LinkButton, AuthenticatedBugModal } from 'react-components';
import { c, ngettext, msgid } from 'ttag';
import { capitalize } from 'proton-shared/lib/helpers/string';

import welcomeMessageSvg from 'design-system/assets/img/shared/welcome-message.svg';
import { LabelCount } from '../../models/label';

interface Props {
    labelCount: LabelCount;
}

const WelcomePane = ({ labelCount }: Props) => {
    const [user] = useUser();
    const { createModal } = useModals();

    const Unread = labelCount.Unread || 0;

    const unreadsLabel = (
        <strong key="unreads-label">
            {ngettext(msgid`${Unread} unread email`, `${Unread} unread emails`, Unread)}
        </strong>
    );

    const reportBugButton = (
        <LinkButton key="report-bug-btn" onClick={() => createModal(<AuthenticatedBugModal />)}>{c('Action')
            .t`report a bug`}</LinkButton>
    );

    return (
        <div className="flex-item-fluid aligncenter p3">
            <h1>
                {user.DisplayName ? c('Title').t`Welcome, ${capitalize(user.DisplayName)}!` : c('Title').t`Welcome`}
            </h1>
            {Unread ? <p>{c('Info').jt`You have ${unreadsLabel} in this folder`}</p> : null}
            {user.hasPaidMail ? (
                <>
                    <p className="mw40e center mb2">
                        {c('Info')
                            .jt`Having trouble sending or receiving emails? Interested in helping us improve our service? Feel free to ${reportBugButton}.`}
                    </p>
                    <img src={welcomeMessageSvg} alt={c('Alternative text for welcome image').t`Welcome`} />
                </>
            ) : (
                <>
                    <p>{c('Info')
                        .t`Upgrade to a paid plan starting from $4/month only and get additional storage capacity and more addresses with ProtonMail Plus.`}</p>
                </>
            )}
        </div>
    );
};

export default WelcomePane;
