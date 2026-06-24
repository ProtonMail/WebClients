import { type ReactNode, useEffect } from 'react';

import { c } from 'ttag';

import { selectPreviousSubscription } from '@proton/account/previousSubscription';
import { useGetPreviousSubscription } from '@proton/account/previousSubscription/hooks';
import { Href } from '@proton/atoms/Href/Href';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import { PLANS, type PlanIDs, getPlanName, getPlanNameFromIDs } from '@proton/payments';
import type { MaybeFreeSubscription } from '@proton/payments/core/subscription/helpers';
import { useStore } from '@proton/redux-shared-store/sharedProvider';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, BRAND_NAME, DRIVE_SHORT_APP_NAME, MAIL_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { UserLockedFlags } from '@proton/shared/lib/interfaces';
import { getAppStorage } from '@proton/shared/lib/user/storage';
import noop from '@proton/utils/noop';

import TopBanner from './TopBanner';

const StorageBannerText = ({
    lockedFlag,
    cta,
    user,
}: {
    lockedFlag: UserLockedFlags;
    cta: ReactNode;
    user: UserModel;
}) => {
    switch (lockedFlag) {
        case UserLockedFlags.BASE_STORAGE_EXCEEDED:
            const mailStorage = getAppStorage(MAIL_SHORT_APP_NAME);
            // Translator: Your Mail storage is full. To send or receive emails, free up space or upgrade for more storage.
            return c('locked_state_storage_banner: info')
                .jt`Your ${mailStorage} is full. To send or receive emails, free up space or ${cta}.`;
        case UserLockedFlags.DRIVE_STORAGE_EXCEEDED:
            const driveStorage = getAppStorage(DRIVE_SHORT_APP_NAME);
            // Translator: Your Drive storage is full. To upload or sync files, free up space or upgrade for more storage.
            return c('locked_state_storage_banner: info')
                .jt`Your ${driveStorage} is full. To upload or sync files, free up space or ${cta}.`;
        case UserLockedFlags.STORAGE_EXCEEDED:
            // Translator: Your storage is full. To continue using Proton , free up space or upgrade for more storage.
            return c('locked_state_storage_banner: info')
                .jt`Your storage is full. To continue using ${BRAND_NAME} products, free up space or ${cta}.`;
        case UserLockedFlags.USER_WITH_A_DOMAIN:
            if (!user.isAdmin) {
                return null; // Only admins should see this banner
            }
            // Translator: To continue using Proton, please make sure your premium features are no longer in use or upgrade your plan.
            return c('locked_state_storage_banner: info')
                .jt`To continue using ${BRAND_NAME}, please make sure your premium features are no longer in use or upgrade your plan.`;
        case UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN:
            // Translator: Your subscription has ended. Upgrade to restore full access and to avoid data loss.
            return c('locked_state_storage_banner: info')
                .jt`Your subscription has ended. ${cta} and to avoid data loss.`;
        case UserLockedFlags.ORG_ISSUE_FOR_MEMBER:
            // Translator: Your account is at risk of deletion. To avoid data loss, ask your admin to upgrade. Learn more
            return c('locked_state_storage_banner: info')
                .jt`Your account is at risk of deletion. To avoid data loss, ask your admin to upgrade. ${cta}`;
    }
};

const getCTAText = (lockedFlag: UserLockedFlags) => {
    switch (lockedFlag) {
        case UserLockedFlags.BASE_STORAGE_EXCEEDED:
        case UserLockedFlags.DRIVE_STORAGE_EXCEEDED:
        case UserLockedFlags.STORAGE_EXCEEDED:
            return c('locked_state_storage_banner: info').t`upgrade for more storage`;
        case UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN:
            return c('locked_state_storage_banner: info').t`Upgrade to restore full access`;
        case UserLockedFlags.ORG_ISSUE_FOR_MEMBER:
            return c('locked_state_storage_banner: info').t`Learn more`;
    }
};

const useUpgradePath = ({
    subscription,
    user,
    lockedFlag,
    app,
}: {
    subscription: MaybeFreeSubscription;
    user: UserModel;
    lockedFlag: UserLockedFlags;
    app: APP_NAMES;
}) => {
    const currentSubscriptionPlanName = subscription ? getPlanName(subscription) : undefined;

    const getPreviousSubscription = useGetPreviousSubscription();
    const store = useStore();
    const previousSubscription = selectPreviousSubscription(store.getState()).value?.previousSubscription;
    const canRestoreFullAccess = lockedFlag === UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN;

    useEffect(
        function conditionallyFetchPreviousSubscription() {
            if (canRestoreFullAccess) {
                getPreviousSubscription().catch(noop);
            }
        },
        [canRestoreFullAccess]
    );

    if (canRestoreFullAccess) {
        const previousSubscriptionPlanIDs: PlanIDs = previousSubscription?.plans ?? {};
        const previousSubscriptionPlanName = getPlanNameFromIDs(previousSubscriptionPlanIDs);

        const planName = currentSubscriptionPlanName ?? previousSubscriptionPlanName;

        const target = planName ? 'checkout' : 'compare';

        return getUpgradePath({ user, plan: planName, target });
    }

    const fallbackPlanName = (() => {
        if (currentSubscriptionPlanName) {
            return currentSubscriptionPlanName;
        }

        return app === APPS.PROTONDRIVE ? PLANS.DRIVE : PLANS.MAIL;
    })();

    return getUpgradePath({ user, plan: fallbackPlanName, subscription });
};

const UpgradeSettingsLink = ({
    user,
    subscription,
    upsellRef,
    lockedFlag,
    ctaText,
    app,
}: {
    user: UserModel;
    subscription: MaybeFreeSubscription;
    upsellRef: string | undefined;
    lockedFlag: UserLockedFlags;
    ctaText: string | undefined;
    app: APP_NAMES;
}) => {
    const upgradePath = useUpgradePath({ subscription, user, lockedFlag, app });

    return (
        <SettingsLink key="upgrade-link" className="color-inherit" path={addUpsellPath(upgradePath, upsellRef)}>
            {ctaText}
        </SettingsLink>
    );
};

const StorageBannerCTA = ({
    user,
    subscription,
    upsellRef,
    lockedFlag,
    app,
}: {
    user: UserModel;
    subscription: MaybeFreeSubscription;
    upsellRef: string | undefined;
    lockedFlag: UserLockedFlags;
    app: APP_NAMES;
}) => {
    const ctaText = getCTAText(lockedFlag);
    return lockedFlag === UserLockedFlags.ORG_ISSUE_FOR_MEMBER ? (
        <Href href={getKnowledgeBaseUrl('/free-plan-limits')}>{ctaText}</Href>
    ) : (
        <UpgradeSettingsLink
            user={user}
            subscription={subscription}
            upsellRef={upsellRef}
            ctaText={ctaText}
            lockedFlag={lockedFlag}
            app={app}
        />
    );
};

const getLockedFlagFromLockedFlags = (lockedFlags: number): UserLockedFlags | null => {
    if (hasBit(lockedFlags, UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN)) {
        return UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN;
    }
    if (hasBit(lockedFlags, UserLockedFlags.ORG_ISSUE_FOR_MEMBER)) {
        return UserLockedFlags.ORG_ISSUE_FOR_MEMBER;
    }
    if (
        hasBit(lockedFlags, UserLockedFlags.BASE_STORAGE_EXCEEDED) &&
        hasBit(lockedFlags, UserLockedFlags.DRIVE_STORAGE_EXCEEDED)
    ) {
        return UserLockedFlags.STORAGE_EXCEEDED;
    }
    if (hasBit(lockedFlags, UserLockedFlags.BASE_STORAGE_EXCEEDED)) {
        return UserLockedFlags.BASE_STORAGE_EXCEEDED;
    }
    if (hasBit(lockedFlags, UserLockedFlags.DRIVE_STORAGE_EXCEEDED)) {
        return UserLockedFlags.DRIVE_STORAGE_EXCEEDED;
    }
    if (hasBit(lockedFlags, UserLockedFlags.USER_WITH_A_DOMAIN)) {
        return UserLockedFlags.USER_WITH_A_DOMAIN;
    }
    return null;
};

interface Props {
    app: APP_NAMES;
    user: UserModel;
    subscription: MaybeFreeSubscription;
    upsellRef: string | undefined;
    lockedFlags: number;
}

export const LockedStateTopBanner = ({ app, user, subscription, upsellRef, lockedFlags }: Props) => {
    const lockedFlag = getLockedFlagFromLockedFlags(lockedFlags);

    if (lockedFlag === null) {
        // Unknown flag, don't show banner
        return null;
    }

    const cta = (
        <StorageBannerCTA
            key="storage-banner-cta"
            user={user}
            subscription={subscription}
            upsellRef={upsellRef}
            app={app}
            lockedFlag={lockedFlag}
        />
    );

    return (
        <TopBanner className="bg-danger" data-testid="storage-banner:lock-state">
            <StorageBannerText lockedFlag={lockedFlag} cta={cta} user={user} />
        </TopBanner>
    );
};
