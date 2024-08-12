import { c, msgid } from 'ttag';

import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import { BRAND_NAME, ORGANIZATION_STATE, VPN_CONNECTIONS } from '@proton/shared/lib/constants';
import { getVPNDedicatedIPs } from '@proton/shared/lib/helpers/subscription';
import type { Address, Organization, SubscriptionModel, UserModel } from '@proton/shared/lib/interfaces';

import { getNCalendarsText } from '../../features/calendar';
import { getFreeUsersText } from '../../features/highlights';
import {
    getB2BFreeVPNConnectionsText,
    getB2BHighSpeedVPNConnectionsText,
    getHighSpeedVPNConnectionsText,
    getVPNConnectionsText,
} from '../../features/vpn';

const getUserText = (isOrganizationDelinquent: boolean, MaxMembers: number, UsedMembers: number) => {
    if (isOrganizationDelinquent) {
        return null;
    }

    if (MaxMembers === 1) {
        return getFreeUsersText();
    }

    return c('Subscription attribute').ngettext(
        msgid`${UsedMembers} of ${MaxMembers} user`,
        `${UsedMembers} of ${MaxMembers} users`,
        MaxMembers
    );
};

const getAddressText = (isOrganizationDelinquent: boolean, MaxAddresses: number, UsedAddresses: number) => {
    if (isOrganizationDelinquent || (MaxAddresses === 1 && UsedAddresses === 1)) {
        return c('Subscription attribute').t`1 email address`;
    }

    return c('Subscription attribute').ngettext(
        msgid`${UsedAddresses} of ${MaxAddresses} email address`,
        `${UsedAddresses} of ${MaxAddresses} email addresses`,
        MaxAddresses
    );
};

const getDomainsText = (isOrganizationDelinquent: boolean, MaxDomains: number, UsedDomains: number) => {
    if (isOrganizationDelinquent) {
        return null;
    }

    return c('Subscription attribute').ngettext(
        msgid`${UsedDomains} of ${MaxDomains} custom domain`,
        `${UsedDomains} of ${MaxDomains} custom domains`,
        MaxDomains
    );
};

const getCalendarText = (user: UserModel, MaxMembers: number) => {
    if (MaxMembers > 1) {
        const n = user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE;
        return c('Subscription attribute').ngettext(msgid`${n} calendar per user`, `${n} calendars per user`, n);
    }
    return getNCalendarsText(user.hasPaidMail ? MAX_CALENDARS_PAID : MAX_CALENDARS_FREE);
};

const getVPNText = (user: UserModel, MaxMembers: number) => {
    if (user.hasPaidVpn) {
        if (MaxMembers > 1) {
            return getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS);
        }
        return getHighSpeedVPNConnectionsText(VPN_CONNECTIONS);
    }
    if (MaxMembers > 1) {
        return getB2BFreeVPNConnectionsText(1);
    }
    return getVPNConnectionsText(1);
};

const getServersText = (subscription?: SubscriptionModel) => {
    const ipAddresses = getVPNDedicatedIPs(subscription);

    return c('Subscription attribute').ngettext(
        msgid`${ipAddresses} dedicated server`,
        `${ipAddresses} dedicated servers`,
        ipAddresses
    );
};

const getMaxVPNDevicesText = () => {
    const maxVpn = 10;
    return c('Subscription attribute').ngettext(
        msgid`High-speed VPN on ${maxVpn} device`,
        `High-speed VPN on ${maxVpn} devices`,
        maxVpn
    );
};

const getWritingAssistantText = (organization?: Organization) => {
    const maxAi = organization?.MaxAI ?? 0;

    if (maxAi === 0) {
        return null;
    }

    return c('Subscription attribute').ngettext(
        msgid`${BRAND_NAME} Scribe writing assistant for ${maxAi} user`,
        `${BRAND_NAME} Scribe writing assistant for ${maxAi} users`,
        maxAi
    );
};

/**
 * Delinquant organizations have some different text for the subscription panel to avoid confusion
 * @param organization Organization to get the subscription panel text
 * @returns Object with the subscription, address and domains text for both delinquant and non-delinquant organizations
 */
export const getSubscriptionPanelText = (
    user: UserModel,
    organization?: Organization,
    addresses?: Address[],
    subscription?: SubscriptionModel
) => {
    const {
        MaxDomains = 0,
        UsedAddresses: OrganizationUsedAddresses,
        MaxAddresses: OrganizationMaxAddresses,
        UsedMembers = 1,
        MaxMembers = 1,
        UsedDomains = 0,
        State,
    } = organization || {};

    const isOrganizationDelinquent = State === ORGANIZATION_STATE.DELINQUENT;
    const hasAddresses = Array.isArray(addresses) && addresses.length > 0;
    const UsedAddresses = hasAddresses ? OrganizationUsedAddresses || 1 : 0;
    const MaxAddresses = OrganizationMaxAddresses || 1;

    return {
        userText: getUserText(isOrganizationDelinquent, MaxMembers, UsedMembers),
        addressText: getAddressText(isOrganizationDelinquent, MaxAddresses, UsedAddresses),
        domainsText: getDomainsText(isOrganizationDelinquent, MaxDomains, UsedDomains),
        calendarText: getCalendarText(user, MaxMembers),
        vpnText: getVPNText(user, MaxMembers),
        serverText: getServersText(subscription),
        maxVPNDevicesText: getMaxVPNDevicesText(),
        writingAssistantText: getWritingAssistantText(organization),
    };
};
