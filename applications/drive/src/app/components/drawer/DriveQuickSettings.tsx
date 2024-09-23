import {
    DefaultQuickSettings,
    DrawerAllSettingsView,
    DrawerAppScrollContainer,
    QuickSettingsButtonSection,
    useConfirmActionModal,
} from '@proton/components';

import ClearSearchDataButton from '../layout/search/ClearSearchDataButton';

const DriveQuickSettings = () => {
    const [confirmModal, showConfirmModal] = useConfirmActionModal();

    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />

            <DefaultQuickSettings />

            <QuickSettingsButtonSection>
                <ClearSearchDataButton showConfirmModal={showConfirmModal} />
            </QuickSettingsButtonSection>

            {confirmModal}
        </DrawerAppScrollContainer>
    );
};

export default DriveQuickSettings;
