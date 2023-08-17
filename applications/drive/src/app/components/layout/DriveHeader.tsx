import { ReactNode } from 'react';

import { c } from 'ttag';

import {
    PrivateHeader,
    RebrandingFeedbackModal,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    UserDropdown,
    useActiveBreakpoint,
    useHasRebrandingFeedback,
    useModalState,
} from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
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
    const { isNarrow, isTablet } = useActiveBreakpoint();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();
    const displayContactsInHeader = useDisplayContactsWidget();

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
                contactsButton={displayContactsInHeader && <TopNavbarListItemContactsDropdown />}
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isNarrow={isNarrow}
                actionArea={!(isNarrow || isTablet) && searchBox}
                settingsButton={settingsButton}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
