import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Option from '@proton/components/components/option/Option';
import SelectTwo from '@proton/components/components/selectTwo/SelectTwo';
import { useActiveBreakpoint } from '@proton/components/index';
import { IcMinusCircleFilled } from '@proton/icons/icons/IcMinusCircleFilled';
import { IcPlusCircleFilled } from '@proton/icons/icons/IcPlusCircleFilled';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { getLabelFromCategoryId } from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import MobileSectionRow from '../MobileSectionRow';

interface CategoryRowItemProps {
    category: CategoryTab;
    onUpdate: (category: CategoryTab) => void;
}

export const CategoryRowItem = ({ category, onUpdate }: CategoryRowItemProps) => {
    const isPrimaryCategory = category.id === MAILBOX_LABEL_IDS.CATEGORY_DEFAULT;
    const categoryLabel = getLabelFromCategoryId(category.id);

    const { viewportWidth } = useActiveBreakpoint();

    return (
        <MobileSectionRow key={category.id}>
            <div
                className={clsx(
                    'w-full flex',
                    viewportWidth.xsmall ? 'flex-column gap-2' : 'flex-row items-center justify-space-between'
                )}
            >
                <div>
                    <>
                        <Button
                            icon
                            size="tiny"
                            shape="ghost"
                            disabled={isPrimaryCategory}
                            className={clsx(isPrimaryCategory ? 'visibility-hidden' : '', 'mr-3')}
                            onClick={() => onUpdate({ ...category, display: !category.display })}
                        >
                            {category.display ? (
                                <IcMinusCircleFilled color="#EE5B5E" alt={c('Action').t`Disable category`} />
                            ) : (
                                <IcPlusCircleFilled color="#39BA64" alt={c('Action').t`Enable category`} />
                            )}
                        </Button>
                        <span className="shrink-0">{categoryLabel}</span>
                    </>
                </div>
                {category.display && !isPrimaryCategory && (
                    <SelectTwo<boolean>
                        value={!!category.notify}
                        onChange={() => onUpdate({ ...category, notify: !category.notify })}
                        fullWidth={false}
                        adaptiveForTouchScreens={false}
                    >
                        <Option title={c('Option').t`Push notifications`} value={true} />
                        <Option title={c('Option').t`None`} value={false} />
                    </SelectTwo>
                )}
            </div>
        </MobileSectionRow>
    );
};
