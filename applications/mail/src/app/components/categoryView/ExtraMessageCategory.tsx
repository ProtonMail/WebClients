import { Badge, useTheme } from '@proton/components';
import { type MessageState } from '@proton/mail/store/messages/messagesTypes';
import clsx from '@proton/utils/clsx';

import RecipientType from '../message/recipients/RecipientType';
import { categoryBadgeMapping } from './categoryViewConstants';
import { hasCategoryLabel, isLabelIDCaregoryKey } from './categoryViewHelpers';

import './ExtraMessageCategory.scss';

interface Props {
    message: MessageState;
}

const CategoryBadge = ({ labelIDs }: { labelIDs?: string[] }) => {
    const theme = useTheme();

    if (!labelIDs) {
        return null;
    }

    // find if one of the labelID is a category key
    const labelID = labelIDs.find((labelID) => isLabelIDCaregoryKey(labelID));
    if (!labelID) {
        return null;
    }

    const { label, className, darkClassName } = categoryBadgeMapping[labelID];
    if (!label || !className || !darkClassName) {
        return null;
    }

    return <Badge className={clsx('text-semibold', theme.information.dark ? darkClassName : className)}>{label}</Badge>;
};

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
