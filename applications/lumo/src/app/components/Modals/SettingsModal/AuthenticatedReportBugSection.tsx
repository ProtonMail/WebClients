import { c } from 'ttag';

import useModalState from '@proton/components/components/modalTwo/useModalState';
import AuthenticatedBugModal from '@proton/components/containers/support/AuthenticatedBugModal';
import { APPS } from '@proton/shared/lib/constants';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
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
                icon="Bug"
                text={c('collider_2025: Title').t`Report a bug`}
                subtext={c('collider_2025: Description').jt`Report a bug or feature request`}
                onClick={() => setBugReportModal(true)}
                button={<LumoIcon name="ChevronRight" className="ml-auto shrink-0 color-hint" size={20} />}
            />

            {renderBugReportModal && <AuthenticatedBugModal {...bugReportModal} app={APPS.PROTONLUMO} />}
        </>
    );
};

export default AuthenticatedReportBugSection;
