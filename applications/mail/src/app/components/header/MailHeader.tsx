import { ReactNode, memo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import {
    FloatingButton,
    Icon,
    PrivateHeader,
    RebrandingFeedbackModal,
    TopNavbarListItemFeedbackButton,
    UserDropdown,
    useFolders,
    useHasRebrandingFeedback,
    useLabels,
    useMailSettings,
    useModalState,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { MESSAGE_ACTIONS } from '../../constants';
import { useOnCompose } from '../../containers/ComposeProvider';
import { getLabelName } from '../../helpers/labels';
import { isColumnMode } from '../../helpers/mailSettings';
import { ComposeTypes } from '../../hooks/composer/useCompose';
import { layoutActions } from '../../logic/layout/layoutSlice';
import { selectLayoutIsExpanded } from '../../logic/layout/layoutSliceSelectors';
import { useAppDispatch, useAppSelector } from '../../logic/store';
import { Breakpoints } from '../../models/utils';
import MailSearch from './search/MailSearch';

interface Props {
    labelID: string;
    elementID: string | undefined;
    selectedIDs: string[];
    breakpoints: Breakpoints;
    toolbar?: ReactNode | undefined;
    settingsButton?: ReactNode;
}

const MailHeader = ({ labelID, elementID, selectedIDs = [], breakpoints, toolbar, settingsButton }: Props) => {
    const location = useLocation();
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const [mailSettings] = useMailSettings();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const dispatch = useAppDispatch();
    const expanded = useAppSelector(selectLayoutIsExpanded);
    const onToggleExpand = useCallback(() => dispatch(layoutActions.toggleExpanded()), []);

    const onCompose = useOnCompose();

    const [feedbackModalProps, setFeedbackModalOpen] = useModalState();

    const hideMenuButton = breakpoints.isNarrow && !!elementID;
    const hideUpsellButton =
        (breakpoints.isNarrow || breakpoints.isTablet) && (!!elementID || selectedIDs.length !== 0);
    const labelName = getLabelName(labelID, labels, folders);

    const isColumn = isColumnMode(mailSettings);

    /** Search is displayed everytime except when we are on message view with row mode */
    const displaySearch = !(!isColumn && elementID);

    return (
        <>
            <PrivateHeader
                userDropdown={<UserDropdown app={APPS.PROTONMAIL} />}
                hideMenuButton={hideMenuButton}
                hideUpsellButton={hideUpsellButton}
                title={labelName}
                feedbackButton={
                    hasRebrandingFeedback ? (
                        <TopNavbarListItemFeedbackButton onClick={() => setFeedbackModalOpen(true)} />
                    ) : null
                }
                actionArea={
                    breakpoints.isNarrow || breakpoints.isTablet || (breakpoints.isSmallDesktop && elementID) ? (
                        <div className="flex flex-nowrap flex-justify-space-between">
                            {toolbar}
                            {!elementID && (
                                <MailSearch
                                    breakpoints={breakpoints}
                                    labelID={labelID}
                                    location={location}
                                    columnMode={isColumn}
                                />
                            )}
                        </div>
                    ) : displaySearch ? (
                        <MailSearch
                            breakpoints={breakpoints}
                            labelID={labelID}
                            location={location}
                            columnMode={isColumn}
                        />
                    ) : (
                        <>{toolbar}</>
                    )
                }
                expanded={expanded}
                onToggleExpand={onToggleExpand}
                isNarrow={breakpoints.isNarrow}
                settingsButton={settingsButton}
                floatingButton={
                    <FloatingButton
                        onClick={() => onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW })}
                    >
                        <Icon size={24} name="pen" className="m-auto" />
                    </FloatingButton>
                }
            />
            <RebrandingFeedbackModal {...feedbackModalProps} />
        </>
    );
};

export default memo(MailHeader);
