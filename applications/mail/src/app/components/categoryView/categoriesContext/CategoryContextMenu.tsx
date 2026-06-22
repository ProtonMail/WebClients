import { c } from 'ttag';

import { ContextMenuSubButton } from '@proton/components/components/contextMenu/ContextMenuSubButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { IcCheckmarkStrong } from '@proton/icons/icons/IcCheckmarkStrong';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { selectCategoryIDs } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useCategoriesView } from '../useCategoriesView';

interface Props {
    onCategoryMove: (categoryId: string) => void;
}

export const CategoryContextMenu = ({ onCategoryMove }: Props) => {
    const { shouldShowTabs, activeCategoriesTabs } = useCategoriesView();

    const currentCategories = useMailSelector(selectCategoryIDs);
    const { sendReportRecategorizeEmail } = useCategoriesTelemetry();

    if (!shouldShowTabs) {
        return null;
    }

    const currentCategory = currentCategories.includes(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)
        ? MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
        : currentCategories[0];

    return (
        <ContextMenuSubButton icon="drawer-dividers" name={c('Action').t`Move to category...`}>
            {activeCategoriesTabs.map((category) => (
                <DropdownMenuButton
                    key={category.id}
                    className="flex items-center flex-nowrap"
                    onClick={(e) => {
                        e.stopPropagation();
                        if (currentCategory !== category.id) {
                            onCategoryMove(category.id);
                            sendReportRecategorizeEmail('context_menu', category.id, currentCategory, 1);
                        }
                    }}
                    onContextMenu={(e) => e.stopPropagation()}
                    aria-pressed={currentCategory === category.id}
                >
                    <CategoryIcon
                        categoryId={category.id}
                        variant="filled"
                        className="mr-2 shrink-0 mail-category-color"
                        colorShade={category.colorShade}
                    />
                    <span className="mr-8">{getLabelFromCategoryId(category.id)}</span>
                    {currentCategory === category.id && (
                        <IcCheckmarkStrong className="color-primary ml-auto shrink-0" />
                    )}
                </DropdownMenuButton>
            ))}
        </ContextMenuSubButton>
    );
};
