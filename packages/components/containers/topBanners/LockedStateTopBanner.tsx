import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms';
import SettingsLink from '@proton/components/components/link/SettingsLink';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, DRIVE_SHORT_APP_NAME, MAIL_SHORT_APP_NAME, PLANS } from '@proton/shared/lib/constants';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { getPlan } from '@proton/shared/lib/helpers/subscription';
import { addUpsellPath, getUpgradePath } from '@proton/shared/lib/helpers/upsell';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Subscription, UserModel } from '@proton/shared/lib/interfaces';
import { UserLockedFlags } from '@proton/shared/lib/interfaces';
import { getAppStorage } from '@proton/shared/lib/user/storage';

import TopBanner from './TopBanner';

const StorageBannerText = ({ app, type, cta }: { app: APP_NAMES; type: UserLockedFlags; cta: ReactNode }) => {
    switch (type) {
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
            if (app === APPS.PROTONDRIVE) {
                // Translator: Your storage is full. To upload or sync files, free up space or upgrade for more storage.
                return c('locked_state_storage_banner: info')
                    .jt`Your storage is full. To upload or sync files, free up space or ${cta}.`;
            }
            // Translator: Your storage is full. To send or receive emails, free up space or upgrade for more storage.
            return c('locked_state_storage_banner: info')
                .jt`Your storage is full. To send or receive emails, free up space or ${cta}.`;
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

const getCTAText = (type: UserLockedFlags) => {
    switch (type) {
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

const StorageBannerCTA = ({
    user,
    subscription,
    upsellRef,
    plan,
    type,
}: {
    user: UserModel;
    subscription: Subscription | undefined;
    upsellRef: string | undefined;
    plan: PLANS;
    type: UserLockedFlags;
}) => {
    const ctaText = getCTAText(type);
    return type === UserLockedFlags.ORG_ISSUE_FOR_MEMBER ? (
        <Href href={getKnowledgeBaseUrl('/free-plan-limits')}>{ctaText}</Href>
    ) : (
        <SettingsLink
            key="upgrade-link"
            className="color-inherit"
            path={addUpsellPath(getUpgradePath({ user, plan, subscription }), upsellRef)}
        >
            {ctaText}
        </SettingsLink>
    );
};

const getBannerTypeFromLockedFlags = (lcokedFlags: number): UserLockedFlags => {
    let type = UserLockedFlags.STORAGE_EXCEEDED;
    if (hasBit(lcokedFlags, UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN)) {
        type = UserLockedFlags.ORG_ISSUE_FOR_PRIMARY_ADMIN;
    } else if (hasBit(lcokedFlags, UserLockedFlags.ORG_ISSUE_FOR_MEMBER)) {
        type = UserLockedFlags.ORG_ISSUE_FOR_MEMBER;
    } else if (
        hasBit(lcokedFlags, UserLockedFlags.BASE_STORAGE_EXCEEDED) &&
        hasBit(lcokedFlags, UserLockedFlags.DRIVE_STORAGE_EXCEEDED)
    ) {
        type = UserLockedFlags.STORAGE_EXCEEDED;
    } else if (hasBit(lcokedFlags, UserLockedFlags.BASE_STORAGE_EXCEEDED)) {
        type = UserLockedFlags.BASE_STORAGE_EXCEEDED;
    } else if (hasBit(lcokedFlags, UserLockedFlags.DRIVE_STORAGE_EXCEEDED)) {
        type = UserLockedFlags.DRIVE_STORAGE_EXCEEDED;
    }
    return type;
};

interface Props {
    app: APP_NAMES;
    user: UserModel;
    subscription: Subscription | undefined;
    upsellRef: string | undefined;
    lockedFlags: number;
}

const LockedStateTopBanner = ({ app, user, subscription, upsellRef, lockedFlags }: Props) => {
    const planName = getPlan(subscription)?.Name;
    let plan = planName;
    if (plan === undefined) {
        plan = app === APPS.PROTONDRIVE ? PLANS.DRIVE : PLANS.MAIL;
    }

    const type = getBannerTypeFromLockedFlags(lockedFlags);

    const cta = (
        <StorageBannerCTA user={user} subscription={subscription} upsellRef={upsellRef} plan={plan} type={type} />
    );

    return (
        <TopBanner className="bg-danger">
            <StorageBannerText app={app} type={type} cta={cta} />
        </TopBanner>
    );
};

export default LockedStateTopBanner;
