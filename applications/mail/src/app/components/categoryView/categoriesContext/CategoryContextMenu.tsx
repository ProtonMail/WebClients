import { c } from 'ttag';

import ContextMenuSubButton from '@proton/components/components/contextMenu/ContextMenuSubButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useCategoriesView } from '../useCategoriesView';

interface Props {
    onCategoryMove: (categoryId: string) => void;
}

export const CategoryContextMenu = ({ onCategoryMove }: Props) => {
    const labelID = useMailSelector(selectLabelID);
    const { shouldShowTabs, activeCategoriesTabs } = useCategoriesView();

    const currentCategories = useMailSelector(selectCategoryIDs);

    if (!shouldShowTabs) {
        return null;
    }

    const currentCategory = currentCategories.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
        : currentCategories[0];

    return (
        <ContextMenuSubButton icon="drawer-dividers" name={c('Action').t`Move to category`}>
            {activeCategoriesTabs
                .filter((item) => item.id !== currentCategory)
                .map((category) => (
                    <DropdownMenuButton
                        key={category.id}
                        className="flex items-center flex-nowrap text-left"
                        onClick={(e) => {
                            e.stopPropagation();
                            onCategoryMove(category.id);
                        }}
                        onContextMenu={(e) => e.stopPropagation()}
                    >
                        <Icon
                            className="mr-2 shrink-0 mail-category-color"
                            name={category.filledIcon}
                            data-color={category.colorShade}
                        />
                        {getLabelFromCategoryId(category.id)}
                        {labelID === category.id && <Icon className="ml-auto shrink-0" name="checkmark" />}
                    </DropdownMenuButton>
                ))}
        </ContextMenuSubButton>
    );
};
