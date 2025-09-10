import type { APP_NAMES } from '../../constants';
import type { SecurityCheckupCohortType } from './SecurityCheckupCohort';

export type SecurityCheckupAction =
    | 'phrase'
    | 'set-email'
    | 'sentinel-email'
    | 'set-phone'
    | 'sentinel-phone'
    | 'device';

export interface SecurityCheckupSession {
    initialCohort: SecurityCheckupCohortType;
    createdTimestamp: number;
}

export interface BackLink {
    appNameFromHostname: APP_NAMES | undefined;
    appName: APP_NAMES | undefined;
    to: string;
    href: string;
}

export type SecurityCheckupSource =
    | 'email_danger'
    | 'email_warning'
    | 'email_info'
    | 'user_dropdown_account'
    | 'user_dropdown_vpn_settings'
    | 'user_dropdown_mail'
    | 'user_dropdown_calendar'
    | 'user_dropdown_drive'
    | 'user_dropdown_docs'
    | 'recovery_settings';
