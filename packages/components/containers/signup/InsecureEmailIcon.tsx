import React from 'react';
import { c } from 'ttag';

import { Info } from '../../index';
import { YANDEX_DOMAINS, YAHOO_DOMAINS, AOL_DOMAINS, MAIL_RU_DOMAINS, GMAIL_DOMAINS } from './constants';

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

const InsecureEmailIcon = ({ email }: Props) => {
    const [, domain = ''] = email.trim().toLowerCase().split('@');
    const title = getInfo(domain);

    if (title) {
        return <Info title={title} originalPlacement="right" />;
    }

    return null;
};

export default InsecureEmailIcon;
