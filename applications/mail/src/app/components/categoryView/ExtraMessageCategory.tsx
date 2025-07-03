import { type MessageState } from '@proton/mail/store/messages/messagesTypes';

import RecipientType from '../message/recipients/RecipientType';
import { CategoryBadge } from './CategoryBadge';
import { hasCategoryLabel } from './categoryViewHelpers';

import './ExtraMessageCategory.scss';

interface Props {
    message: MessageState;
}

export const ExtraMessageCategory = ({ message }: Props) => {
    if (!hasCategoryLabel(message.data?.LabelIDs)) {
        return null;
    }

    return (
        <div className="category-badge-container">
            <RecipientType label="Category">
                <CategoryBadge labelIDs={message.data?.LabelIDs} />
            </RecipientType>
        </div>
    );
};

export default ExtraMessageCategory;
