import { useLocation } from 'react-router-dom';

import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import { getLabelName } from 'proton-mail/helpers/labels';
import { isColumnMode } from 'proton-mail/helpers/mailSettings';
import type { ElementsStructure } from 'proton-mail/hooks/mailbox/useElements';
import type { MailboxActions } from 'proton-mail/router/interface';
import { selectElementID, selectLabelID, selectisSearching } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import MailSearch from '../header/search/MailSearch';
import LabelName from './actions/LabelName';
import { MoreDropdown } from './more-dropdown/MoreDropdown';
import { useMailboxToolbarBreakpoints } from './useMailToolbarResponsive';

interface Props {
    elementsData: ElementsStructure;
    actions: MailboxActions;
}

export const MailToolbarHeader = ({ elementsData, actions }: Props) => {
    const location = useLocation();

    const { ref, isTiny, isExtraTiny, isSmallScreen } = useMailboxToolbarBreakpoints();

    const labelID = useMailSelector(selectLabelID);
    const elementID = useMailSelector(selectElementID);
    const isSearching = useMailSelector(selectisSearching);

    const [mailSettings] = useMailSettings();
    const isColumn = isColumnMode(mailSettings);

    const [labels] = useLabels();
    const [folders] = useFolders();
    const labelName = getLabelName(labelID, labels, folders);

    if (isSmallScreen) {
        const actionsInHeader = elementID || actions.selectedIDs.length > 0;

        return (
            <div className="w-full flex items-center justify-space-between" ref={ref}>
                {actionsInHeader ? (
                    <span>small screen actions</span>
                ) : (
                    <>
                        <div className="flex items-center flex-nowrap toolbar-inner gap-2">
                            <LabelName selectedIDs={actions.selectedIDs} labelName={labelName} />
                            <MoreDropdown
                                elementIDs={elementsData.elementIDs}
                                selectedIDs={actions.selectedIDs}
                                isSearch={isSearching}
                                isNarrow={isTiny}
                                isTiny={isTiny}
                                isExtraTiny={isExtraTiny}
                                onMove={actions.handleMove}
                                onDelete={actions.handleDelete}
                                onCheckAll={actions.handleCheckAll}
                            />
                        </div>
                        <MailSearch labelID={labelID} location={location} columnMode={isColumn} />
                    </>
                )}
            </div>
        );
    }

    // TODO add toolbarRef
    const actionsInHeader = !isColumn && elementID;
    return actionsInHeader ? (
        <span>large screen actions</span>
    ) : (
        <MailSearch labelID={labelID} location={location} columnMode={isColumn} />
    );
};
