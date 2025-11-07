import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';

import config from '../config';

const termsLink = `${getAppStaticUrl(config.APP_NAME)}/legal/terms`;

export const getTermAndConditionsSentence = () => {
    const termsAndConditionsLink = (
        <Href className="" href={termsLink} key="eslint-autofix-F8A7DD">{`terms and conditions`}</Href>
    );

    return c('Wallet Upgrade').jt`By continuing, you agree to our ${termsAndConditionsLink}`;
};
