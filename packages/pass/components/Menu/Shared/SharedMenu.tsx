import type { FC, ReactNode } from 'react';
import { memo } from 'react';
import { useSelector } from 'react-redux';

import { c, msgid } from 'ttag';

import { SharedMenuItem } from '@proton/pass/components/Menu/Shared/SharedMenuItem';
import { useItemScope } from '@proton/pass/components/Navigation/NavigationMatches';
import { PassPlusPromotionButton } from '@proton/pass/components/Upsell/PassPlusPromotionButton';
import { useUpselling } from '@proton/pass/components/Upsell/UpsellingProvider';
import { UpsellRef } from '@proton/pass/constants';
import {
    selectPassPlan,
    selectSharedByMeCount,
    selectSharedWithMeCount,
    selectVisibleSecureLinksCount,
} from '@proton/pass/store/selectors';
import { UserPassPlan } from '@proton/pass/types/api/plan';
import { truthy } from '@proton/pass/utils/fp/predicates';

type Props = {
    onAction?: () => void;
    heading?: ReactNode;
};

export const SharedMenuContent: FC<Props> = ({ heading, onAction }) => {
    const scope = useItemScope();

    const sharedWithMeCount = useSelector(selectSharedWithMeCount);
    const sharedByMeCount = useSelector(selectSharedByMeCount);
    const secureLinksCount = useSelector(selectVisibleSecureLinksCount);

    const elements = [
        sharedWithMeCount > 0 && (
            <SharedMenuItem
                key="shared-with-me"
                label={c('Label').t`Shared with me`}
                count={sharedWithMeCount}
                selected={scope === 'shared-with-me'}
                to="shared-with-me"
                icon="user-arrow-left"
                onAction={onAction}
            />
        ),

        sharedByMeCount > 0 && (
            <SharedMenuItem
                key="shared-by-me"
                label={c('Label').t`Shared by me`}
                count={sharedByMeCount}
                selected={scope === 'shared-by-me'}
                to="shared-by-me"
                icon="user-arrow-right"
                onAction={onAction}
            />
        ),
        secureLinksCount > 0 && (
            <SharedMenuItem
                key="secure-links"
                label={c('Action').t`Secure links`}
                count={secureLinksCount}
                selected={scope === 'secure-links'}
                subLabel={c('Label').ngettext(
                    msgid`${secureLinksCount} secure link`,
                    `${secureLinksCount} secure links`,
                    secureLinksCount
                )}
                to="secure-links"
                icon="link"
                onAction={onAction}
            />
        ),
    ].filter(truthy);

    return (
        <>
            {elements.length > 0 && heading}
            {elements}
        </>
    );
};

export const SharedMenu = memo(() => {
    const upsell = useUpselling();
    const passPlan = useSelector(selectPassPlan);
    const free = passPlan === UserPassPlan.FREE;

    return (
        <div className="flex flex-column w-full">
            <SharedMenuContent
                heading={
                    <div className="px-2 flex flex-nowrap items-center gap-3 w-full mb-2">
                        <span className="text-ellipsis color-weak"> {c('Label').t`Shared`}</span>
                        {free && (
                            <PassPlusPromotionButton
                                style={{ '--background-norm': 'var(--background-strong)' }}
                                onClick={() => upsell({ type: 'pass-plus', upsellRef: UpsellRef.ITEM_SHARING })}
                            />
                        )}
                    </div>
                }
            />
        </div>
    );
});

SharedMenu.displayName = 'SharedMenuMemo';
