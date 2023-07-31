import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters, getSignupDescription, getSignupTitle } from './interface';

const data = (): Parameters => ({
    title: getSignupTitle(PASS_APP_NAME),
    description: getSignupDescription(PASS_APP_NAME),
});

export default data;
