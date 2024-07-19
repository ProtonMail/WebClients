import { MAIL_APP_NAME } from '@proton/shared/lib/constants';

import type { Parameters } from './interface';
import { getLoginDescription, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(MAIL_APP_NAME),
    description: getLoginDescription(MAIL_APP_NAME),
});

export default data;
