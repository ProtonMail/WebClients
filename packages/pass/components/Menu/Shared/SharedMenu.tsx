import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { SharedMenuItem } from '@proton/pass/components/Menu/Shared/SharedMenuItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { UpsellRef } from '@proton/pass/constants';
import {
    selectPassPlan,
    selectSecureLinksCount,
    selectSharedByMeCount,
    selectSharedWithMeCount,
} from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';

export const SharedMenu = memo(() => {
    const scope = useItemScope();

    const sharedWithMeCount = useSelector(selectSharedWithMeCount);
    const sharedByMeCount = useSelector(selectSharedByMeCount);
    const secureLinksCount = useSelector(selectSecureLinksCount);

    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <div className="flex flex-column gap-2 w-full">
            <div className="mx-2 flex flex-nowrap items-center gap-3">
                <span className="text-ellipsis color-weak"> {c('Label').t`Shared`}</span>
                {free && <PassPlusPromotionButton style={{ '--background-norm': 'var(--background-strong)' }} />}
            </div>
            <div className="flex">
                {sharedWithMeCount > 0 && (
                    <SharedMenuItem
                        upsellRef={free ? UpsellRef.ITEM_SHARING : undefined}
                        label={c('Label').t`Shared with me`}
                        count={sharedWithMeCount}
                        selected={scope === 'shared-with-me'}
                        to="shared-with-me"
                        icon="user-arrow-left"
                    />
                )}

                {sharedByMeCount > 0 && (
                    <SharedMenuItem
                        upsellRef={free ? UpsellRef.ITEM_SHARING : undefined}
                        label={c('Label').t`Shared by me`}
                        count={sharedByMeCount}
                        selected={scope === 'shared-by-me'}
                        to="shared-by-me"
                        icon="user-arrow-right"
                    />
                )}

                <SharedMenuItem
                    upsellRef={free ? UpsellRef.SECURE_LINKS : undefined}
                    label={c('Action').t`Secure links`}
                    count={secureLinksCount}
                    selected={scope === 'secure-links'}
                    to="secure-links"
                    icon="link"
                />
            </div>
        </div>
    );
});

SharedMenu.displayName = 'SharedMenuMenuMemo';
