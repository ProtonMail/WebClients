import { ReactNode } from 'react';
import { c } from 'ttag';

import {
    PrivateHeader,
    useActiveBreakpoint,
    TopNavbarListItemContactsDropdown,
    TopNavbarListItemSettingsDropdown,
    UserDropdown,
    useModalState,
} from '@proton/components';
import { APPS } from '@proton/shared/lib/constants';

import { SearchField } from './search/SearchField';
import ClearSearchDataButton from './search/ClearSearchDataButton';
import DriveOnboardingModal from '../onboarding/DriveOnboardingModal';

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
    const [onboardingModal, setOnboardingModal, renderOnboardingModal] = useModalState();

    return (
        <>
            {renderOnboardingModal && <DriveOnboardingModal showGenericSteps {...onboardingModal} />}
            <PrivateHeader
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
        </>
    );
};

export const DriveHeaderPrivate = (props: Props) => {
    return <DriveHeader {...props} searchBox={<SearchField />} />;
};
