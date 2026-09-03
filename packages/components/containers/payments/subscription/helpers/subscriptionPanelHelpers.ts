import { c, msgid } from 'ttag';

import { MAX_CALENDARS_FREE, MAX_CALENDARS_PAID } from '@proton/shared/lib/calendar/constants';
import {
    BRAND_NAME,
    LUMO_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MEET_APP_NAME,
    ORGANIZATION_STATE,
    VPN_CONNECTIONS,
} from '@proton/shared/lib/constants';
import type { Address, Organization, UserModel } from '@proton/shared/lib/interfaces';

import { getScribeWritingAssistantText } from '../assistant/helpers';
import { getNCalendarsText } from '../../features/calendar';
import { getFreeUsersText } from '../../features/highlights';
import {
    getB2BFreeVPNConnectionsText,
    getB2BHighSpeedVPNConnectionsText,
    getHighSpeedVPNConnectionsText,
    getVPNConnectionsText,
} from '../../features/vpn';
import type { Upsell } from './dashboard-upsells';

/**
 * Feature ids that switch on the b2b users row in the subscription panel.
 *
 * Only `users` is meaningful here. The other three are listed because the check used
 * to match on the users icon, which all four of these features render, so they have
 * always switched the row on by accident — a Meet Business upsell does it through
 * "N participants". Narrowing the list to `users` changes what renders, so it is left
 * to a follow-up rather than smuggled into a refactor.
 */
const B2B_USERS_ROW_FEATURE_IDS = [
    'users',
    'contact-groups-management',
    'max-participants',
    'manage-user-permissions-and-access',
];

export const upsellsShowB2BUsersRow = (upsells: Upsell[]) =>
    upsells.some((upsell) => upsell.features.some((feature) => B2B_USERS_ROW_FEATURE_IDS.includes(feature.id)));

/** Shared ngettext so Lumo/Meet lines do not duplicate the same placeholder pattern in one context (i18n validate). */
const getProductForUsersSubscriptionAttributeText = (productName: string, count: number) =>
    c('Subscription attribute').ngettext(
        msgid`${productName} for ${count} user`,
        `${productName} for ${count} users`,
        count
    );

const getUserText = (isOrganizationDelinquent: boolean, MaxMembers: number, UsedMembers: number) => {
    if (isOrganizationDelinquent || MaxMembers === 0) {
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

const getAddressText = (
    isOrganizationDelinquent: boolean,
    MaxAddresses: number,
    UsedAddresses: number,
    MaxMembers: number
) => {
    if (MaxMembers > 1 && MaxAddresses === 1 && UsedAddresses === 1 && !isOrganizationDelinquent) {
        return c('Subscription attribute').t`1 email address per user`;
    }

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

const getServersText = (organization?: Organization) => {
    const ipAddresses = organization?.MaxDedicatedIPs ?? 0;

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

const getWritingAssistantText = (
    organization: Organization | undefined,
    maxMembers: number,
    scribeToLumo: boolean
) => {
    const maxAi = organization?.MaxAI ?? 0;

    if (maxAi === 0) {
        return null;
    }

    if (maxMembers === 1) {
        return getScribeWritingAssistantText(scribeToLumo);
    } else {
        return scribeToLumo
            ? c('Subscription attribute').ngettext(
                  msgid`${LUMO_SHORT_APP_NAME} writing assistant for ${maxAi} user`,
                  `${LUMO_SHORT_APP_NAME} writing assistant for ${maxAi} users`,
                  maxAi
              )
            : c('Subscription attribute').ngettext(
                  msgid`${BRAND_NAME} Scribe writing assistant for ${maxAi} user`,
                  `${BRAND_NAME} Scribe writing assistant for ${maxAi} users`,
                  maxAi
              );
    }
};

const getLumoText = (organization: Organization | undefined, maxMembers: number) => {
    const maxLumo = organization?.MaxLumo ?? 0;

    if (maxLumo === 0) {
        return null;
    }

    if (maxMembers === 1) {
        return c('Addon').t`${LUMO_APP_NAME} AI assistant`;
    } else {
        return getProductForUsersSubscriptionAttributeText(LUMO_APP_NAME, maxLumo);
    }
};

const getMeetText = (organization: Organization | undefined, maxMembers: number) => {
    const maxMeet = organization?.MaxMeet ?? 0;

    if (maxMeet === 0) {
        return null;
    }

    if (maxMembers === 1) {
        return MEET_APP_NAME;
    } else {
        return getProductForUsersSubscriptionAttributeText(MEET_APP_NAME, maxMeet);
    }
};

/**
 * Delinquant organizations have some different text for the subscription panel to avoid confusion
 * @param user - Logged-in user
 * @param organization - Organization to get the subscription panel text
 * @param addresses - Addresses of the logged-in users
 * @returns Object with the subscription, address and domains text for both delinquent and non-delinquent organizations
 */
export const getSubscriptionPanelText = (
    user: UserModel,
    organization: Organization | undefined,
    addresses: Address[] | undefined,
    scribeToLumo: boolean
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
        addressText: getAddressText(isOrganizationDelinquent, MaxAddresses, UsedAddresses, MaxMembers),
        domainsText: getDomainsText(isOrganizationDelinquent, MaxDomains, UsedDomains),
        calendarText: getCalendarText(user, MaxMembers),
        vpnText: getVPNText(user, MaxMembers),
        serverText: getServersText(organization),
        maxVPNDevicesText: getMaxVPNDevicesText(),
        writingAssistantText: getWritingAssistantText(organization, MaxMembers, scribeToLumo),
        lumoText: getLumoText(organization, MaxMembers),
        meetText: getMeetText(organization, MaxMembers),
    };
};
