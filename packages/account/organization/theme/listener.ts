import { EntitlementName } from '@proton/payments/core/entitlements/entitlement-names';
import { getTotalEntitlementQuantity } from '@proton/payments/core/entitlements/helpers';
import type { Entitlements } from '@proton/payments/core/entitlements/interface';
import type { SharedStartListening } from '@proton/redux-shared-store-types/interface';
import { getOrganizationLogo } from '@proton/shared/lib/api/organization';
import noop from '@proton/utils/noop';

import { bootstrapEvent } from '../../bootstrap/action';
import { type EntitlementsState, entitlementsThunk, selectEntitlements } from '../../entitlements';
import { selectUser } from '../../user';
import { type OrganizationState, selectOrganization } from '../index';
import { getOrganizationThemeFromCookie, serializeOrgTheme, syncToCookie } from './cookie';
import { organizationThemeSlice } from './slice';

const getHasAccess = (entitlements: Entitlements) =>
    getTotalEntitlementQuantity(entitlements, EntitlementName.CustomOrganizationLogo) > 0;

const getOrganizationLogoURL = (data: { logoID: string | null; API_URL: string; UID: string }) => {
    if (!data.logoID) {
        return '';
    }
    const config = getOrganizationLogo(data.logoID);
    return `${data.API_URL}/${config.url}?UID=${data.UID}`;
};

export const organizationThemeListener = (
    startListening: SharedStartListening<OrganizationState & EntitlementsState>
) => {
    startListening({
        predicate: (action, currentState, previousState) => {
            const currentOrganization = selectOrganization(currentState).value;
            const previousOrganization = selectOrganization(previousState).value;
            return (
                bootstrapEvent.match(action) ||
                Boolean(
                    currentOrganization?.PlanName !== previousOrganization?.PlanName ||
                    currentOrganization?.Settings !== previousOrganization?.Settings ||
                    currentOrganization?.Name !== previousOrganization?.Name ||
                    selectEntitlements(currentState).value !== selectEntitlements(previousState).value
                )
            );
        },
        effect: (_, listenerApi) => {
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

            const canHaveLogo = !!selectUser(state).value?.isPaid;
            const entitlements = selectEntitlements(state).value;
            if (canHaveLogo && !entitlements) {
                listenerApi.dispatch(entitlementsThunk()).catch(noop);
                return;
            }

            const access = canHaveLogo && !!entitlements && getHasAccess(entitlements);

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
