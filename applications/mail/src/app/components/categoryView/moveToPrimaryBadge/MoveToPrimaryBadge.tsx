import type { MouseEvent } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { CategoryIcon } from '@proton/mail/features/categoriesView/CategoryIcon';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useCategoriesTelemetry } from '@proton/mail/features/categoriesView/useCategoriesTelemetry';
import { isCategoryLabel } from '@proton/mail/helpers/location';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { APPLY_LOCATION_TYPES } from 'proton-mail/hooks/actions/applyLocation/interface';
import { useApplyLocation } from 'proton-mail/hooks/actions/applyLocation/useApplyLocation';
import type { Element } from 'proton-mail/models/element';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { categoryColorClassName } from '../categoriesTabs/tabsInterface';

interface Props {
    element: Element;
    className?: string;
}

export const MoveToPrimaryBadge = ({ element, className }: Props) => {
    const labelID = useMailSelector(selectLabelID);
    const { applyLocation } = useApplyLocation();
    const { sendReportRecategorizeExperiment } = useCategoriesTelemetry();

    // The badge is rendered inside clickable list items, we don't want to open the element when moving it
    const handleClick = (event: MouseEvent) => {
        event.stopPropagation();

        void applyLocation({
            type: APPLY_LOCATION_TYPES.MOVE,
            elements: [element],
            destinationLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
        });

        if (isCategoryLabel(labelID)) {
            sendReportRecategorizeExperiment(labelID);
        }
    };

    return (
        <Button size="tiny" onClick={handleClick} className={clsx('flex items-center gap-1', className)}>
            <CategoryIcon
                categoryId={MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}
                variant="filled"
                colorShade={CATEGORIES_COLOR_SHADES.IRIS}
                className={categoryColorClassName}
            />
            <span>{c('Info').t`Move to Primary`}</span>
        </Button>
    );
};
