import { c } from 'ttag';

import { ContextMenuSubButton } from '@proton/components/components/contextMenu/ContextMenuSubButton';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import Icon from '@proton/components/components/icon/Icon';
import { IcCheckmarkStrong } from '@proton/icons/icons/IcCheckmarkStrong';
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
                    <Icon
                        className="mr-2 shrink-0 mail-category-color"
                        name={category.filledIcon}
                        data-color={category.colorShade}
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
