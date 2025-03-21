import { c } from 'ttag';

import { Product } from '@proton/shared/lib/ProductEnum';
import {
    APPS,
    CALENDAR_APP_NAME,
    CONTACTS_APP_NAME,
    DOCS_APP_NAME,
    DRIVE_APP_NAME,
    MAIL_APP_NAME,
    PASS_APP_NAME,
    VPN_APP_NAME,
    WALLET_APP_NAME,
} from '@proton/shared/lib/constants';

import type { AccessControlApplication } from './types';

const getAccessControlApplications = (): AccessControlApplication[] => {
    return [
        {
            title: MAIL_APP_NAME,
            description: c('Info').t`Email service, integrated with ${CALENDAR_APP_NAME} and ${CONTACTS_APP_NAME}`,
            appName: APPS.PROTONMAIL,
            product: Product.Mail,
        },
        {
            title: CALENDAR_APP_NAME,
            description: c('Info').t`Calendar, integrated with ${MAIL_APP_NAME} and ${CONTACTS_APP_NAME}`,
            appName: APPS.PROTONCALENDAR,
            product: Product.Calendar,
        },
        {
            title: DRIVE_APP_NAME,
            description: c('Info').t`Cloud storage, integrated with ${DOCS_APP_NAME}`,
            appName: APPS.PROTONDRIVE,
            product: Product.Drive,
        },
        {
            title: VPN_APP_NAME,
            description: c('Info').t`VPN with dedicated servers and IP addresses`,
            appName: APPS.PROTONVPN_SETTINGS,
            product: Product.VPN,
        },
        {
            title: PASS_APP_NAME,
            description: c('Info').t`Password manager with extra account security`,
            appName: APPS.PROTONPASS,
            product: Product.Pass,
        },
        {
            title: WALLET_APP_NAME,
            description: c('Info').t`Self-custodial crypto wallet`,
            appName: APPS.PROTONWALLET,
            product: Product.Wallet,
        },
    ];
};

export default getAccessControlApplications;
