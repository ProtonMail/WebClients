import type { MessageState } from '@proton/mail/store/messages/messagesTypes';
import { getItem } from '@proton/shared/lib/helpers/storage';

import RecipientType from 'proton-mail/components/message/recipients/RecipientType';
import type { Element } from 'proton-mail/models/element';

import { CategoryBadge } from './CategoryBadge';
import { CategoryBadgeInfo } from './CategoryBadgeInfo';
import { DISABLED_BADGE } from './categoryViewConstants';
import { hasCategoryLabel } from './categoryViewHelpers';
import { useCategoryViewExperiment } from './useCategoryViewExperiment';

import './ExtraMessageCategory.scss';

interface Props {
    message: MessageState;
    element?: Element;
}

export const ExtraMessageCategory = ({ message, element }: Props) => {
    const { canSeeCategoryLabel } = useCategoryViewExperiment();

    if (!hasCategoryLabel(message.data?.LabelIDs) || !canSeeCategoryLabel || getItem(DISABLED_BADGE)) {
        return null;
    }

    return (
        <div className="category-badge-container">
            <RecipientType label="Category">
                <CategoryBadge labelIDs={message.data?.LabelIDs} element={element} index={-1} />
                <CategoryBadgeInfo className="mt-1" />
            </RecipientType>
        </div>
    );
};

export default ExtraMessageCategory;
