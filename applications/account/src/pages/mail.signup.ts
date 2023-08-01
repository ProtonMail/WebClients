import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters, getSignupDescription, getSignupTitle } from './interface';

const data = (): Parameters => ({
    title: getSignupTitle(MAIL_APP_NAME),
    description: getSignupDescription(MAIL_APP_NAME),
});

export default data;
