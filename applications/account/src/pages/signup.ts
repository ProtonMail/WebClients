import { c } from 'ttag';

import { BRAND_NAME, CALENDAR_SHORT_APP_NAME, DRIVE_SHORT_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import { Parameters } from './interface';

const data = (): Parameters => ({
    title: c('Metadata title').t`Create a ${BRAND_NAME} Account | Take back your privacy`,
    description: c('Metadata title')
        .t`Create a ${BRAND_NAME} Account to use all encrypted ${BRAND_NAME} services such as ${MAIL_APP_NAME}, ${DRIVE_SHORT_APP_NAME}, ${CALENDAR_SHORT_APP_NAME}, and more, with just one login. Get a Free ${BRAND_NAME} Account.`,
});

export default data;
