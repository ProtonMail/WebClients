import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';
import { getOrganizationLogo } from '@proton/shared/lib/api/organization';
import { PLANS } from '@proton/shared/lib/constants';
import type { Organization } from '@proton/shared/lib/interfaces';

import { bootstrapEvent } from '../../bootstrap/action';
import { type OrganizationState, selectOrganization } from '../index';
import { getOrganizationThemeFromCookie, serializeOrgTheme, syncToCookie } from './cookie';
import { organizationThemeSlice } from './slice';

const getHasAccess = (organization: Organization | undefined) => {
    return [PLANS.BUNDLE_PRO, PLANS.PASS_BUSINESS, PLANS.VPN_BUSINESS, PLANS.ENTERPRISE, PLANS.NEW_VISIONARY].includes(
        organization?.PlanName as any
    );
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
        predicate: (action) => {
            return bootstrapEvent.match(action);
        },
        effect: async (_, listenerApi) => {
            listenerApi.unsubscribe();

            const organizationThemeFromCookie = getOrganizationThemeFromCookie();
            let logoURL = '';
            let orgName = '';
            let access = false;
            const authentication = listenerApi.extra.authentication;
            const config = listenerApi.extra.config;

            if (organizationThemeFromCookie && organizationThemeFromCookie.LocalID === authentication.localID) {
                logoURL = getOrganizationLogoURL({
                    logoID: organizationThemeFromCookie.LogoID,
                    UID: authentication.UID,
                    API_URL: config.API_URL,
                });
                orgName = organizationThemeFromCookie.Name;
                access = true;
            } else {
                const state = listenerApi.getState();
                const organization = selectOrganization(state).value;
                if (organization) {
                    access = getHasAccess(organization);
                }
            }

            listenerApi.dispatch(
                organizationThemeSlice.actions.set({
                    access,
                    name: orgName,
                    showName: true,
                    logoURL,
                })
            );
        },
    });

    startListening({
        predicate: (action, currentState, nextState) => {
            const currentOrganization = selectOrganization(currentState).value;
            const nextOrganization = selectOrganization(nextState).value;
            return Boolean(
                currentOrganization?.PlanName !== nextOrganization?.PlanName ||
                    currentOrganization?.Settings !== nextOrganization?.Settings ||
                    currentOrganization?.Name !== nextOrganization?.Name
            );
        },
        effect: async (_, listenerApi) => {
            const authentication = listenerApi.extra.authentication;
            const config = listenerApi.extra.config;

            const state = listenerApi.getState();
            const organization = selectOrganization(state).value;
            const settings = organization?.Settings;

            const access = getHasAccess(organization);
            if (!organization || !settings || !access) {
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
                    showName: settings.ShowName,
                    logoURL: getOrganizationLogoURL({
                        logoID: settings.LogoID,
                        UID: authentication.UID,
                        API_URL: config.API_URL,
                    }),
                })
            );
        },
    });
};
