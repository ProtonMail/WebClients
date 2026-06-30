import { c } from 'ttag';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';

import { selectLabelIDUnreadCount } from 'proton-mail/hooks/mailboxCounter/useMaiboxCounter.selector';
import { useMailSelector } from 'proton-mail/store/hooks';

interface Props {
    category: CategoryTab;
}

export const TabNewCount = ({ category }: Props) => {
    const count = useMailSelector((state) => selectLabelIDUnreadCount(state, category.id));
    if (count <= 0) {
        return null;
    }

    const displayCount = count > 99 ? '99+' : `${count}`;
    return (
        <span className="tab-new-count text-semibold mail-category-color" aria-hidden="true">
            {
                // translator: number of new mails, displayed on hover, e.g. "3 new" or "99+ new"
                c('Info').t`${displayCount} new`
            }
        </span>
    );
};
