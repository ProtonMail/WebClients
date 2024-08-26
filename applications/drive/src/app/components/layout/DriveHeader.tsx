import type { ReactNode } from 'react';

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

import isSearchFeatureEnabled from '../../utils/isSearchFeatureEnabled';
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
    const [{ open, onClose, onExit, key }, setRebrandingFeedbackModal] = useModalState();

    return (
        <>
            <PrivateHeader
                app={APPS.PROTONDRIVE}
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
                actionArea={isSearchFeatureEnabled() && searchBox}
                settingsButton={settingsButton}
            />

            <RebrandingFeedbackModal key={key} open={open} onClose={onClose} onExit={onExit} />
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
