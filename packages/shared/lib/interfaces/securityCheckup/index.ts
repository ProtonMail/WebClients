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
