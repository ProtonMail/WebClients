import { useConfirmActionModal } from '@proton/components';
import {
    DefaultQuickSettings,
    QuickSettingsButtonSection,
} from '@proton/components/components/drawer/views/quickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import { DrawerAppScrollContainer } from '@proton/components/components/drawer/views/shared';

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
