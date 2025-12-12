import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Icon } from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';
import { getAppSpace, getSpace } from '@proton/shared/lib/user/storage';

import { useSuggestBusinessModal } from '../../../modals/SuggestBusinessModal/useSuggestBusinessModal';

export function SuggestBusinessButton() {
    const [user] = useUser();
    const space = getAppSpace(getSpace(user), APPS.PROTONDRIVE);
    const usedSpaceRatio = space.usedSpace / space.maxSpace;

    const [modal, showModal] = useSuggestBusinessModal();

    // Business will get a spotlight for 1 week each month for free users with less than 50% storage used
    const dayOfMonth = new Date().getDate();
    const shouldSuggestBusiness = !user.isPaid && usedSpaceRatio < 0.5 && dayOfMonth >= 15 && dayOfMonth <= 22;
    if (shouldSuggestBusiness) {
        return (
            <>
                <button
                    className="flex items-center gap-2 rounded-full py-2 px-4"
                    style={{ backgroundColor: '#67E8F9', color: '#1B1341' }}
                    onClick={() => showModal({})}
                >
                    <Icon name="briefcase" />
                    {c('Action').t`Get Drive for Business`}
                </button>
                {modal}
            </>
        );
    }

    // Will show the default upsell buttons (if applicable)
    return undefined;
}
