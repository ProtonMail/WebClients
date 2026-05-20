import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { APPS } from '@proton/shared/lib/constants';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { SettingsSectionItemButton } from './SettingsSectionItem';

const AuthenticatedReportBugSection = () => {
    const isGuest = useIsGuest();
    const [bugReportModal, setBugReportModal, renderBugReportModal] = useModalState();

    // Don't render anything for guest users
    if (isGuest) {
        return null;
    }

    return (
        <>
            <SettingsSectionItemButton
                icon="bug"
                text={c('collider_2025: Title').t`Report a bug`}
                subtext={c('collider_2025: Description').jt`Report a bug or feature request`}
                onClick={() => setBugReportModal(true)}
                button={<IcChevronRight className="ml-auto shrink-0 color-hint" size={5} />}
            />

            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} app={APPS.PROTONLUMO} />}
        </>
    );
};

export default AuthenticatedReportBugSection;
