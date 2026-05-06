import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';
import { selectElementID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { CategoriesTabs } from '../categoryView/categoriesTabs/CategoriesTabs';
import { useCategoriesView } from '../categoryView/useCategoriesView';
import { useMailboxToolbarBreakpoints } from './useMailToolbarResponsive';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbarList = ({}: Props) => {
    const { isSmallScreen } = useMailboxToolbarBreakpoints();

    const elementID = useMailSelector(selectElementID);

    const { shouldShowTabs } = useCategoriesView();
    const [mailSettings] = useMailSettings();
    const isColumn = isColumnMode(mailSettings);

    if (isSmallScreen) {
        const actionsInHeader = elementID;
        if (actionsInHeader) {
            return null;
        }

        // TODO add toolbarRef
        return (
            <>
                <span>small list toolbar</span>
                {shouldShowTabs && <CategoriesTabs />}
            </>
        );
    }

    // TODO add toolbarRef
    const actionsInHeader = !isColumn && elementID;
    if (actionsInHeader) {
        return null;
    }

    return (
        <>
            <span>large list toolbar</span>
            {shouldShowTabs && <CategoriesTabs />}
        </>
    );
};
