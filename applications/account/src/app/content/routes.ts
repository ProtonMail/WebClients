import { getAccountAppRoutes } from '../containers/account/routes';
import { getAuthenticatorAppRoutes } from '../containers/authenticator/routes';
import { getCalendarAppRoutes } from '../containers/calendar/routes';
import { getDocsAppRoutes } from '../containers/docs/routes';
import { getDriveAppRoutes } from '../containers/drive/routes';
import { getMailAppRoutes } from '../containers/mail/routes';
import { getMeetAppRoutes } from '../containers/meet/routes';
import { getMspAppRoutes } from '../containers/msp/routes';
import { getOrganizationAppRoutes } from '../containers/organization/routes';
import { getPassAppRoutes } from '../containers/pass/routes';
import { getVpnAppRoutes } from '../containers/vpn/routes';
import { getWalletAppRoutes } from '../containers/wallet/routes';
import type { AccountRouterParams, AllRouterParams, OrganizationRouterParams } from './router-params';

export const getRoutes = (params: AllRouterParams) => {
    const { accountSettings, organizationSettings, ...sharedSettings } = params;
    const accountParams: AccountRouterParams = {
        ...sharedSettings,
        ...organizationSettings,
        ...accountSettings,
    };
    const organizationParams: OrganizationRouterParams = {
        ...sharedSettings,
        ...organizationSettings,
    };
    return {
        account: getAccountAppRoutes(accountParams),
        mail: getMailAppRoutes(organizationParams),
        calendar: getCalendarAppRoutes(organizationParams),
        drive: getDriveAppRoutes(organizationParams),
        docs: getDocsAppRoutes(organizationParams),
        pass: getPassAppRoutes(organizationParams),
        organization: getOrganizationAppRoutes(organizationParams),
        msp: getMspAppRoutes(sharedSettings),
        vpn: getVpnAppRoutes(sharedSettings),
        wallet: getWalletAppRoutes(),
        meet: getMeetAppRoutes(),
        authenticator: getAuthenticatorAppRoutes(sharedSettings),
    };
};

export type Routes = ReturnType<typeof getRoutes>;
