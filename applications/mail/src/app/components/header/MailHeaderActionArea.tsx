import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

import useActiveBreakpoint from '@proton/components/hooks/useActiveBreakpoint';
import { useCategoriesData } from '@proton/mail/features/categoriesView/useCategoriesData';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';
import { selectElementID, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { MailToolbar } from '../toolbar/MailToolbar';
import MailSearch from './search/MailSearch';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
    toolbar?: ReactNode | undefined;
}

export const MailHeaderActionArea = ({ elementsData, actions, toolbar }: Props) => {
    const location = useLocation();

    const { shouldSeeWideToolbars } = useCategoriesData();

    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);

    const [mailSettings] = useMailSettings();
    const breakpoints = useActiveBreakpoint();
    const isColumn = isColumnMode(mailSettings);

    /** Search is displayed everytime except when we are on message view with row mode */
    const displaySearch = !(!isColumn && elementID);

    if (shouldSeeWideToolbars) {
        return <MailToolbar placement="header" actions={actions} elementsData={elementsData} />;
    }

    return breakpoints.viewportWidth['<=small'] ||
        breakpoints.viewportWidth.medium ||
        (breakpoints.viewportWidth.large && elementID) ? (
        <div className="flex-1 flex flex-nowrap justify-space-between">
            {toolbar}
            {!elementID && <MailSearch labelID={labelID} location={location} columnMode={isColumn} />}
        </div>
    ) : displaySearch ? (
        <MailSearch labelID={labelID} location={location} columnMode={isColumn} />
    ) : (
        <>{toolbar}</>
    );
};
