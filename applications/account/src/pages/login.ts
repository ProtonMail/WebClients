import { c } from 'ttag';

import { BRAND_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters, getLoginTitle } from './interface';

const data = (): Parameters => ({
    title: getLoginTitle(c('Metadata title').t`${BRAND_NAME} Account`),
    description: c('Metadata title')
        .t`Sign in to your ${BRAND_NAME} Account to access all encrypted ${BRAND_NAME} services such as ${MAIL_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, and more. Don't have an account? Create one for FREE.`,
});

export default data;
