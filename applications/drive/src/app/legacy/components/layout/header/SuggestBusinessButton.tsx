import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { useSummerSale2026 } from '@proton/components/containers/offers/operations/summerSale2026configs';
import { IcBriefcase } from '@proton/icons/icons/IcBriefcase';
import { APPS, BRAND_NAME } from '@proton/shared/lib/constants';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';

import { useSuggestBusinessModal } from '../../../../modals/SuggestBusinessModal/useSuggestBusinessModal';

export function SuggestBusinessButton() {
    const [user] = useUser();
    const space = getAppSpace(getSpace(user), APPS.PROTONDRIVE);
    const usedSpaceRatio = space.usedSpace / space.maxSpace;
    const summerSale2026 = useSummerSale2026();
    const isSummerSaleLoading = summerSale2026.some((op) => op.isLoading);
    const hasSummerSaleOffer = summerSale2026.some((op) => op.isValid);

    const [modal, showModal] = useSuggestBusinessModal();

    // Business will get a spotlight for 1 week each month for free users with less than 50% storage used
    // Should not show during summer sale
    const now = new Date();
    const dayOfMonth = now.getDate();
    const shouldSuggestBusiness =
        !isSummerSaleLoading &&
        !hasSummerSaleOffer &&
        !user.isPaid &&
        usedSpaceRatio < 0.5 &&
        dayOfMonth >= 15 &&
        dayOfMonth <= 22;

    if (shouldSuggestBusiness) {
        return (
            <>
                <button
                    className="flex items-center gap-2 rounded-full py-2 px-4 relative interactive-pseudo"
                    style={{ backgroundColor: '#67E8F9', color: '#1B1341' }}
                    onClick={() => showModal({})}
                >
                    <IcBriefcase className="shrink-0" />
                    {c('Action').t`Try ${BRAND_NAME} Workspace`}
                </button>
                {modal}
            </>
        );
    }

    // Will show the default upsell buttons (if applicable)
    return undefined;
}
