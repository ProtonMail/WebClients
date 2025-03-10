import { DrawerAppScrollContainer, QuickSettingsButtonSection, useConfirmActionModal } from '@proton/components';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';

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
