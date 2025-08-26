import { PLANS } from '@proton/payments';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { getOrganizationLogo } from '@proton/shared/lib/api/organization';
import type { Organization } from '@proton/shared/lib/interfaces';

import { bootstrapEvent } from '../../bootstrap/action';
import { type OrganizationState, selectOrganization } from '../index';
import { getOrganizationThemeFromCookie, serializeOrgTheme, syncToCookie } from './cookie';
import { organizationThemeSlice } from './slice';

const getHasAccess = (organization: Organization | undefined) => {
    return [
        PLANS.BUNDLE_PRO,
        PLANS.BUNDLE_PRO_2024,
        PLANS.MAIL_BUSINESS,
        PLANS.DRIVE_BUSINESS,
        PLANS.PASS_BUSINESS,
        PLANS.VPN_BUSINESS,
        PLANS.VISIONARY,
    ].includes(organization?.PlanName as any);
};

const getOrganizationLogoURL = (data: { logoID: string | null; API_URL: string; UID: string }) => {
    if (!data.logoID) {
        return '';
    }
    const config = getOrganizationLogo(data.logoID);
    return `${data.API_URL}/${config.url}?UID=${data.UID}`;
};

export const organizationThemeListener = (startListening: SharedStartListening<OrganizationState>) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentOrganization = selectOrganization(currentState).value;
            const previousOrganization = selectOrganization(previousState).value;
            return (
                bootstrapEvent.match(action) ||
                Boolean(
                    currentOrganization?.PlanName !== previousOrganization?.PlanName ||
                        currentOrganization?.Settings !== previousOrganization?.Settings ||
                        currentOrganization?.Name !== previousOrganization?.Name
                )
            );
        },
        effect: async (_, listenerApi) => {
            const authentication = listenerApi.extra.authentication;
            const config = listenerApi.extra.config;

            const state = listenerApi.getState();
            const organization = selectOrganization(state).value;
            const organizationSettings = organization?.Settings;

            if (!organization || !organizationSettings) {
                const organizationThemeFromCookie = getOrganizationThemeFromCookie();
                if (organizationThemeFromCookie && organizationThemeFromCookie.LocalID === authentication.localID) {
                    listenerApi.dispatch(
                        organizationThemeSlice.actions.set({
                            access: true,
                            name: organizationThemeFromCookie.Name,
                            showName: true,
                            logoURL: getOrganizationLogoURL({
                                logoID: organizationThemeFromCookie.LogoID,
                                UID: authentication.UID,
                                API_URL: config.API_URL,
                            }),
                        })
                    );
                    return;
                }
            }

            const access = getHasAccess(organization);
            if (!organization || !organizationSettings || !access) {
                if (!access) {
                    syncToCookie(serializeOrgTheme(undefined, authentication.localID));
                }
                listenerApi.dispatch(organizationThemeSlice.actions.reset({ access }));
                return;
            }

            syncToCookie(serializeOrgTheme(organization, authentication.localID));

            listenerApi.dispatch(
                organizationThemeSlice.actions.set({
                    access,
                    name: organization.Name || '',
                    showName: organizationSettings.ShowName,
                    logoURL: getOrganizationLogoURL({
                        logoID: organizationSettings.LogoID,
                        UID: authentication.UID,
                        API_URL: config.API_URL,
                    }),
                })
            );
        },
    });
};
