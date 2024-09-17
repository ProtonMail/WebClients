import type { APP_NAMES } from '../../constants';
import type SecurityCheckupCohort from './SecurityCheckupCohort';

export type SecurityCheckupAction = 'phrase' | 'email' | 'phone' | 'device';

export interface SecurityCheckupSession {
    initialCohort: SecurityCheckupCohort;
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
