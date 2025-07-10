import { type MessageState } from '@proton/mail/store/messages/messagesTypes';

import RecipientType from 'proton-mail/components/message/recipients/RecipientType';
import type { Element } from 'proton-mail/models/element';

import { CategoryBadge } from './CategoryBadge';
import { hasCategoryLabel } from './categoryViewHelpers';

import './ExtraMessageCategory.scss';

interface Props {
    message: MessageState;
    element?: Element;
}

export const ExtraMessageCategory = ({ message, element }: Props) => {
    if (!hasCategoryLabel(message.data?.LabelIDs)) {
        return null;
    }

    return (
        <div className="category-badge-container">
            <RecipientType label="Category">
                <CategoryBadge labelIDs={message.data?.LabelIDs} element={element} />
            </RecipientType>
        </div>
    );
};

export default ExtraMessageCategory;
