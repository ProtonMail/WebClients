import React from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import aliasSampleSvg from '@proton/styles/assets/img/illustrations/pass-aliases-alias-sample.svg';

import DrawerAppHeadline from '../../shared/DrawerAppHeadline';

const HasNoAliases = () => {
    const learnMoreLink = (
        <Href
            key="pass-aliases-support"
            className="inline-block"
            href={getKnowledgeBaseUrl('/addresses-and-aliases')}
        >{c('Link').t`Learn more`}</Href>
    );

    return (
        <div className="text-center mt-1">
            <img src={aliasSampleSvg} alt="" className="w-full mb-3" />
            <DrawerAppHeadline>{c('Security Center').t`Protect your online identity`}</DrawerAppHeadline>
            <p className="m-0 mt-2 text-sm color-weak">{c('Security Center')
                .jt`Hide-my-email aliases let you sign up for things online without sharing your email address. ${learnMoreLink}`}</p>
        </div>
    );
};

export default HasNoAliases;
