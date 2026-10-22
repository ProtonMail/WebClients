import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useConfirmActionModal } from '@proton/components/components/confirmActionModal/ConfirmActionModal';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import QuickSettingsButton from '@proton/components/components/drawer/views/quickSettings/QuickSettingsButton';
import QuickSettingsButtonSection from '@proton/components/components/drawer/views/quickSettings/QuickSettingsButtonSection';
import DrawerAppScrollContainer from '@proton/components/components/drawer/views/shared/DrawerAppScrollContainer';
import { useDrive } from '@proton/drive/sdk';

import { useDebug } from '../../../legacy/hooks/drive/useDebug';
import { useDiagnosticsModal } from '../../../modals/DiagnosticsModal';
import { ClearSearchDataButton } from '../../../sections/search/clearSearchDataButton';
import { downloadLogs } from '../../../utils/downloadLogs';

const DriveQuickSettings = () => {
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { getLogs } = useDrive();
    const debug = useDebug();
    const [showDiagnosticsModal, openDiagnosticsModal] = useDiagnosticsModal();

    const clearSearchButton = <ClearSearchDataButton showConfirmModal={showConfirmModal} />;

    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />

            <DefaultQuickSettings />

            <QuickSettingsButtonSection>
                {clearSearchButton}
                {debug ? (
                    <Tooltip
                        title={c('Info').t`Get logs and other information for technical support and troubleshooting`}
                    >
                        <QuickSettingsButton
                            onClick={() => openDiagnosticsModal({})}
                            data-testid="mail-quick-settings:clear-cache-button"
                        >
                            {c('Action').t`Diagnostics`}
                            {showDiagnosticsModal}
                        </QuickSettingsButton>
                    </Tooltip>
                ) : (
                    <Tooltip title={c('Info').t`Export diagnostic logs for technical support and troubleshooting`}>
                        <QuickSettingsButton
                            onClick={() => downloadLogs(getLogs())}
                            data-testid="mail-quick-settings:clear-cache-button"
                        >
                            {c('Action').t`Export system log`}
                        </QuickSettingsButton>
                    </Tooltip>
                )}
            </QuickSettingsButtonSection>

            {confirmModal}
        </DrawerAppScrollContainer>
    );
};

export default DriveQuickSettings;
