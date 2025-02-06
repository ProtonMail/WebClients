import type { FC } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { FeatureFlag } from '@proton/pass/components/Core/WithFeatureFlag';
import { SharedMenuItem } from '@proton/pass/components/Menu/Shared/SharedMenuItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import {
    selectPassPlan,
    selectSecureLinksCount,
    selectSharedByMeCount,
    selectSharedWithMeCount,
} from '@proton/pass/store/selectors';
import { PassFeature } from '@proton/pass/types/api/features';
import { UserPassPlan } from '@proton/pass/types/api/plan';

type Props = {
    dense?: boolean;
    onAction?: () => void;
};

export const SharedMenuContent: FC<Props> = ({ dense, onAction }) => {
    const scope = useItemScope();

    const sharedWithMeCount = useSelector(selectSharedWithMeCount);
    const sharedByMeCount = useSelector(selectSharedByMeCount);
    const secureLinksCount = useSelector(selectSecureLinksCount);
    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <>
            {sharedWithMeCount > 0 && (
                <FeatureFlag feature={PassFeature.PassItemSharingV1}>
                    <SharedMenuItem
                        upsellRef={free ? UpsellRef.ITEM_SHARING : undefined}
                        label={c('Label').t`Shared with me`}
                        count={sharedWithMeCount}
                        selected={scope === 'shared-with-me'}
                        to="shared-with-me"
                        icon="user-arrow-left"
                        onAction={onAction}
                        dense={dense}
                    />
                </FeatureFlag>
            )}

            {sharedByMeCount > 0 && (
                <FeatureFlag feature={PassFeature.PassItemSharingV1}>
                    <SharedMenuItem
                        upsellRef={free ? UpsellRef.ITEM_SHARING : undefined}
                        label={c('Label').t`Shared by me`}
                        count={sharedByMeCount}
                        selected={scope === 'shared-by-me'}
                        to="shared-by-me"
                        icon="user-arrow-right"
                        onAction={onAction}
                        dense={dense}
                    />
                </FeatureFlag>
            )}

            <SharedMenuItem
                upsellRef={free ? UpsellRef.SECURE_LINKS : undefined}
                label={c('Action').t`Secure links`}
                count={secureLinksCount}
                selected={scope === 'secure-links'}
                to="secure-links"
                icon="link"
                onAction={onAction}
                dense={dense}
            />
        </>
    );
};

export const SharedMenu = memo(() => {
    const upsell = useUpselling();
    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <div className="flex flex-column w-full">
            <div className="px-2 flex flex-nowrap items-center gap-3 w-full mb-2">
                <span className="text-ellipsis color-weak"> {c('Label').t`Shared`}</span>
                {free && (
                    <PassPlusPromotionButton
                        style={{ '--background-norm': 'var(--background-strong)' }}
                        onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })}
                    />
                )}
            </div>
            <SharedMenuContent />
        </div>
    );
});

SharedMenu.displayName = 'SharedMenuMemo';
