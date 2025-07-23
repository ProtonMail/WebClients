import { c } from 'ttag';

import { Href } from '@proton/atoms';
import { getAppStaticUrl } from '@proton/shared/lib/helpers/url';

import config from '../config';

const termsLink = `${getAppStaticUrl(config.APP_NAME)}/legal/terms`;

export const getTermAndConditionsSentence = () => {
    const termsAndConditionsLink = <Href className="" href={termsLink}>{`terms and conditions`}</Href>;

    return c('Wallet Upgrade').jt`By continuing, you agree to our ${termsAndConditionsLink}`;
};
