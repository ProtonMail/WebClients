import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters, getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(MAIL_APP_NAME),
    description: getLoginDescription(MAIL_APP_NAME),
});

export default data;
