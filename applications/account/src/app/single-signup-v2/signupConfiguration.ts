import { FREE_PLAN, PLANS, getPlanFromPlanIDs } from '@proton/payments';
import { getIsLumoApp, getIsPassApp } from '@proton/shared/lib/authentication/apps';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import type { Audience } from '@proton/shared/lib/interfaces';
import { type VPNServersCountData } from '@proton/shared/lib/interfaces';

import type { PublicTheme } from '../containers/PublicThemeProvider';
import { getAuthenticatorConfiguration } from './authenticator/configuration';
import { getDriveConfiguration } from './drive/configuration';
import { getGenericConfiguration } from './generic/configuration';
import type { SignupModelV2, SignupParameters2 } from './interface';
import { getLumoConfiguration } from './lumo/configuration';
import { getMailConfiguration } from './mail/configuration';
import { getPassConfiguration } from './pass/configuration';
import { getWalletConfiguration } from './wallet/configuration';

export const getSignupConfiguration = ({
    toApp,
    audience,
    model,
    signupParameters,
    vpnServersCountData,
    viewportWidth,
    theme,
}: {
    toApp?: APP_NAMES;
    model: SignupModelV2;
    signupParameters: SignupParameters2;
    audience: Audience.B2B | Audience.B2C;
    vpnServersCountData: VPNServersCountData;
    viewportWidth: any; // todo lazy
    theme: PublicTheme;
}) => {
    const planIDs = model.optimistic.planIDs || model.subscriptionData.planIDs;
    const plan = getPlanFromPlanIDs(model.plansMap, planIDs) || FREE_PLAN;

    if (toApp === APPS.PROTONDRIVE || toApp === APPS.PROTONDOCS) {
        return getDriveConfiguration({
            audience,
            freePlan: model.freePlan,
            mode: signupParameters.mode,
            plan,
            plansMap: model.plansMap,
            isLargeViewport: viewportWidth['>=large'],
            hideFreePlan: signupParameters.hideFreePlan,
            toApp,
            signupParameters,
        });
    }
    if (toApp === APPS.PROTONMAIL || toApp === APPS.PROTONCALENDAR) {
        return getMailConfiguration({
            audience,
            signupParameters,
            plan,
            planParameters: model.planParameters,
            plansMap: model.plansMap,
            isLargeViewport: viewportWidth['>=large'],
            vpnServersCountData,
            freePlan: model.freePlan,
            canUseBYOE: toApp === APPS.PROTONMAIL,
        });
    }
    if (getIsPassApp(toApp)) {
        const currentPlanName = model.session?.organization?.PlanName;
        const showPassFamily = currentPlanName === PLANS.PASS || currentPlanName === undefined;

        return getPassConfiguration({
            showPassFamily,
            audience,
            isLargeViewport: viewportWidth['>=large'],
            vpnServersCountData,
            hideFreePlan: signupParameters.hideFreePlan,
            mode: signupParameters.mode,
            isPaidPassVPNBundle: !!planIDs[PLANS.VPN_PASS_BUNDLE],
            isPaidPass: [
                PLANS.VISIONARY,
                PLANS.FAMILY,
                PLANS.BUNDLE,
                PLANS.BUNDLE_PRO,
                PLANS.BUNDLE_PRO_2024,
                PLANS.VPN_PASS_BUNDLE,
                PLANS.PASS,
                PLANS.PASS_BUSINESS,
                PLANS.PASS_PRO,
                PLANS.PASS_FAMILY,
                PLANS.PASS_LIFETIME,
            ].some((plan) => planIDs[plan]),
            plan,
            signupParameters,
        });
    }
    if (toApp === APPS.PROTONWALLET) {
        return getWalletConfiguration({
            audience,
            plan,
            signedIn: Boolean(model.session),
            isLargeViewport: viewportWidth['>=large'],
            hideFreePlan: signupParameters.hideFreePlan,
            mode: signupParameters.mode,
            plansMap: model.plansMap,
        });
    }

    if (getIsLumoApp(toApp)) {
        return getLumoConfiguration({
            defaultPlan: signupParameters.defaultPlan,
        });
    }

    if (toApp === APPS.PROTONAUTHENTICATOR) {
        return getAuthenticatorConfiguration({
            defaultPlan: signupParameters.defaultPlan,
        });
    }

    return getGenericConfiguration({
        toApp,
        theme,
        audience,
        signupParameters,
        plan,
        freePlan: model.freePlan,
        planParameters: model.planParameters,
        plansMap: model.plansMap,
        isLargeViewport: viewportWidth['>=large'],
        vpnServersCountData,
    });
};
