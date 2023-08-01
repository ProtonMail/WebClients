import { DRIVE_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters, getSignupDescription, getSignupTitle } from './interface';

const data = (): Parameters => ({
    title: getSignupTitle(DRIVE_APP_NAME),
    description: getSignupDescription(DRIVE_APP_NAME),
});

export default data;
