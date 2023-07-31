import { c } from 'ttag';

import { BRAND_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Reset your ${BRAND_NAME} Account password`,
    description: c('Metadata title')
        .t`Forgot your ${BRAND_NAME} Account password? Reset it here using a recovery code, email, or SMS and regain access to your ${MAIL_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, and more.`,
});

export default data;
