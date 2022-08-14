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
    useHasRebrandingFeedback,
    useModalState,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import DriveOnboardingModal from '../onboarding/DriveOnboardingModal';
import ClearSearchDataButton from './search/ClearSearchDataButton';
import { SearchField } from './search/SearchField';

interface Props {
    isHeaderExpanded: boolean;
    toggleHeaderExpanded: () => void;
    floatingPrimary: ReactNode;
    logo: ReactNode;
    searchBox?: ReactNode;
    title?: string;
}

export const DriveHeader = ({
    logo,
    isHeaderExpanded,
    toggleHeaderExpanded,
    floatingPrimary,
    title = c('Title').t`Drive`,
    searchBox,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const hasRebrandingFeedback = useHasRebrandingFeedback();
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();
    const [rebrandingFeedbackModal, setRebrandingFeedbackModal] = useModalState();

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
                logo={logo}
                title={title}
                contactsButton={<TopNavbarListItemContactsDropdown />}
                settingsButton={
                    <TopNavbarListItemSettingsDropdown to="/drive" toApp={APPS.PROTONACCOUNT}>
                        <ClearSearchDataButton />
                    </TopNavbarListItemSettingsDropdown>
                }
                expanded={isHeaderExpanded}
                onToggleExpand={toggleHeaderExpanded}
                isNarrow={isNarrow}
                floatingButton={floatingPrimary}
                searchBox={searchBox}
            />

            <RebrandingFeedbackModal {...rebrandingFeedbackModal} />
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
