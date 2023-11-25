import { ReactNode } from 'react';

import { c } from 'ttag';

import {
    PrivateHeader,
    RebrandingFeedbackModal,
    TopNavbarListItemFeedbackButton,
    UserDropdown,
    useActiveBreakpoint,
    useHasRebrandingFeedback,
    useModalState,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { SearchField } from './search/SearchField';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    searchBox?: ReactNode;
    title?: string;
    settingsButton?: ReactNode;
}

export const DriveHeader = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    title = c('Title').t`Drive`,
    searchBox,
    settingsButton,
}: Props) => {
    const { viewportWidth } = useActiveBreakpoint();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();

    return (
        <>
            <PrivateHeader
                feedbackButton={
                    hasRebrandingFeedback ? (
                        <TopNavbarListItemFeedbackButton onClick={() => setRebrandingFeedbackModal(true)} />
                    ) : null
                }
                userDropdown={<UserDropdown app={APPS.PROTONDRIVE} />}
                title={title}
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isSmallViewport={viewportWidth['<=small']}
                actionArea={!(viewportWidth['<=small'] || viewportWidth.medium) && searchBox}
                settingsButton={settingsButton}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
