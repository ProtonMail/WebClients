import { ReactNode } from 'react';

import { c } from 'ttag';

import {
    PrivateHeader,
    RebrandingFeedbackModal,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemFeedbackButton,
    TopNavbarListItemSettingsDropdown,
    UserDropdown,
    useActiveBreakpoint,
    useConfirmActionModal,
    useHasRebrandingFeedback,
    useModalState,
} from '@proton/components';
import useDisplayContactsWidget from '@proton/components/hooks/useDisplayContactsWidget';
import { APPS } from '@proton/shared/lib/constants';

import DriveOnboardingModal from '../modals/DriveOnboardingModal';
import ClearSearchDataButton from './search/ClearSearchDataButton';
import { SearchField } from './search/SearchField';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    searchBox?: ReactNode;
    title?: string;
}

export const DriveHeader = ({
    isHeaderExpanded,
    toggleHeaderExpanded,
    title = c('Title').t`Drive`,
    searchBox,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const displayContactsInHeader = useDisplayContactsWidget();

    return (
        <>
            {renderOnboardingModal && <DriveOnboardingModal showGenericSteps {...onboardingModal} />}
            <PrivateHeader
                feedbackButton={
                    hasRebrandingFeedback ? (
                        <TopNavbarListItemFeedbackButton onClick={() => setRebrandingFeedbackModal(true)} />
                    ) : null
                }
                userDropdown={<UserDropdown onOpenIntroduction={() => setOnboardingModal(true)} />}
                title={title}
                contactsButton={displayContactsInHeader && <TopNavbarListItemContactsDropdown />}
                settingsButton={
                    <TopNavbarListItemSettingsDropdown to="/drive" toApp={APPS.PROTONACCOUNT}>
                        <ClearSearchDataButton showConfirmModal={showConfirmModal} />
                    </TopNavbarListItemSettingsDropdown>
                }
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isNarrow={isNarrow}
                searchBox={searchBox}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
            {confirmModal}
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
