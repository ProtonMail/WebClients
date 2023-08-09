import { useConfirmActionModal } from '@proton/components/components';
import {
    DefaultQuickSettings,
    QuickSettingsButtonSection,
    QuickSettingsMain,
} from '@proton/components/components/drawer/views/quickSettings';

import ClearSearchDataButton from '../layout/search/ClearSearchDataButton';

const DriveQuickSettings = () => {
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    return (
        <QuickSettingsMain>
            <DefaultQuickSettings />

            <QuickSettingsButtonSection>
                <ClearSearchDataButton showConfirmModal={showConfirmModal} />
            </QuickSettingsButtonSection>

            {confirmModal}
        </QuickSettingsMain>
    );
};

export default DriveQuickSettings;
