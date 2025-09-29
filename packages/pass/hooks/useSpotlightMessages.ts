import { useMemo } from 'react';

import { c } from 'ttag';

import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SubTheme } from '@proton/pass/components/Layout/Theme/types';
import { AliasSync } from '@proton/pass/components/Onboarding/AliasSync';
import { UserRenewal } from '@proton/pass/components/Onboarding/UserRenewal';
import type { SpotlightMessageDefinition } from '@proton/pass/components/Spotlight/SpotlightContent';
import { FiveStarIcon, ShieldIcon } from '@proton/pass/components/Spotlight/SpotlightIcon';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import { SpotlightMessage } from '@proton/pass/types';
import { BRAND_NAME, PASS_APP_NAME, PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { toMap } from '@proton/shared/lib/helpers/object';
import noop from '@proton/utils/noop';

export const useSpotlightMessages = (extra: SpotlightMessageDefinition[] = []) => {
    const { onLink, openSettings, getRatingURL, onForceUpdate } = usePassCore();
    const upsell = useUpselling();

    return useMemo<Partial<Record<SpotlightMessage, SpotlightMessageDefinition>>>(
        () =>
            toMap(
                <SpotlightMessageDefinition[]>[
                    {
                        type: SpotlightMessage.TRIAL,
                        mode: 'default',
                        id: 'trial',
                        title: c('Title').t`Our welcome gift to you`,
                        message: c('Info')
                            .t`7 days to try premium features for free. Only during your first week of ${BRAND_NAME}.`,
                        className: SubTheme.ORANGE,
                        onClose: () => upsell(null),
                        action: {
                            label: c('Label').t`Learn more`,
                            type: 'link',
                            onClick: () => upsell({ type: 'free-trial', upsellRef: UpsellRef.FREE_TRIAL }),
                        },
                    },
                    {
                        type: SpotlightMessage.SECURE_EXTENSION,
                        mode: 'default',
                        id: 'pin',
                        title: c('Title').t`Secure your data`,
                        message: c('Info').t`Enable auto-locking to secure your data`,
                        className: SubTheme.VIOLET,
                        icon: ShieldIcon,
                        action: {
                            label: c('Label').t`Create lock`,
                            type: 'button',
                            onClick: () => openSettings?.('security'),
                        },
                    },
                    {
                        type: SpotlightMessage.UPDATE_AVAILABLE,
                        mode: 'default',
                        id: 'update',
                        title: c('Title').t`Update available`,
                        message: c('Info')
                            .t`A new version of ${PASS_APP_NAME} is available. Update it to enjoy the latest features and bug fixes.`,
                        className: SubTheme.ORANGE,
                        action: {
                            label: c('Label').t`Update`,
                            type: 'button',
                            onClick: onForceUpdate ?? noop,
                        },
                    },
                    {
                        type: SpotlightMessage.USER_RATING,
                        mode: 'default',
                        id: 'rating',
                        title: c('Title').t`Enjoying ${PASS_APP_NAME}?`,
                        message: c('Info').t`Please consider leaving a review.`,
                        className: SubTheme.PURPLE,
                        icon: FiveStarIcon,
                        action: {
                            label: c('Label').t`Rate us`,
                            type: 'button',
                            onClick: getRatingURL ? () => onLink(getRatingURL()) : noop,
                        },
                        weak: true,
                    },
                    {
                        type: SpotlightMessage.STORAGE_ISSUE,
                        mode: 'default',
                        id: 'storage',
                        title: c('Title').t`Low disk space`,
                        message: c('Info')
                            .t`We are having trouble syncing data to your local storage. Please make sure you have sufficient disk space for ${PASS_SHORT_APP_NAME} to work smoothly.`,
                        className: SubTheme.RED,
                        action: {
                            label: c('Label').t`Need help?`,
                            type: 'button',
                            onClick: () => openSettings?.('support'),
                        },
                    },
                    {
                        type: SpotlightMessage.B2B_ONBOARDING,
                        mode: 'default',
                        id: 'b2b',
                        title: c('Title').t`Get Started`,
                        message: '',
                        className: `${SubTheme.TEAL} hidden`,
                        icon: ShieldIcon,
                    },
                    {
                        type: SpotlightMessage.ALIAS_SYNC_ENABLE,
                        mode: 'custom',
                        component: AliasSync,
                        id: 'alias-sync',
                        className: SubTheme.TEAL,
                        weak: true,
                    },
                    {
                        type: SpotlightMessage.USER_RENEWAL,
                        mode: 'custom',
                        component: UserRenewal,
                        id: 'user-renewal',
                        className: SubTheme.RED,
                        weak: true,
                    },
                    ...extra,
                ],
                'type'
            ),
        []
    );
};
