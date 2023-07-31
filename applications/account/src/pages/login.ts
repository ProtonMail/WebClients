import { c } from 'ttag';

import { BRAND_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title')
        .t`Sign in | ${BRAND_NAME} Account - Access ${MAIL_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, and more`,
    description: c('Metadata title')
        .t`Sign in to your ${BRAND_NAME} Account to access all encrypted ${BRAND_NAME} services such as ${MAIL_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, and more. Don't have an account? Create one for FREE.`,
});

export default data;
