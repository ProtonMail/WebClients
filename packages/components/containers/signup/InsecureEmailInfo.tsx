import React from 'react';
import { validateEmailAddress } from 'proton-shared/lib/helpers/email';
import { c } from 'ttag';

import { Icon } from '../../components';
import {
    INSECURE_DOMAINS,
    YANDEX_DOMAINS,
    YAHOO_DOMAINS,
    AOL_DOMAINS,
    MAIL_RU_DOMAINS,
    GMAIL_DOMAINS,
} from './constants';

interface Props {
    email: string;
}

const getInfo = (domain: string) => {
    if (GMAIL_DOMAINS.includes(domain)) {
        return c('Info')
            .t`Google records your online activity and reads your personal data in order to provide access for advertisers and other third parties. For better privacy, create a secure email address.`;
    }
    if (YAHOO_DOMAINS.includes(domain)) {
        return c('Info')
            .t`Yahoo reads your personal data in order to provide access for advertisers, US intelligence agencies and other third parties. For better privacy, create a secure email address.`;
    }
    if (AOL_DOMAINS.includes(domain)) {
        return c('Info')
            .t`AOL reads your personal data in order to provide access for advertisers and other third parties. For better privacy, create a secure email address.`;
    }
    if (YANDEX_DOMAINS.includes(domain)) {
        return c('Info')
            .t`Yandex records your online activity and reads your personal data in order to provide access for advertisers and other third parties. For better privacy, create a secure email address.`;
    }
    if (MAIL_RU_DOMAINS.includes(domain)) {
        return c('Info')
            .t`Mail.ru reads your personal data in order to provide access for advertisers, Russian government agencies and other third parties. For better privacy, create a secure email address.`;
    }
};

const InsecureEmailInfo = ({ email }: Props) => {
    if (!validateEmailAddress(email)) {
        return null;
    }

    const [, domain = ''] = email.trim().toLowerCase().split('@');

    if (INSECURE_DOMAINS.includes(domain)) {
        return (
            <details className="no-details-marker mb1 bg-global-attention color-white pl1 pr1 pb0-5 pt0-5">
                <summary className="p0 flex flex-spacebetween flex-nowrap flex-items-center">
                    <span>{c('Title').t`This address might compromise your privacy.`}</span>
                    <Icon name="caret" />
                </summary>
                <div className="pt0-5">{getInfo(domain)}</div>
            </details>
        );
    }

    return null;
};

export default InsecureEmailInfo;
