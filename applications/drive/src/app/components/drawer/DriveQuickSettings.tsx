import { c } from 'ttag';

import { Tooltip } from '@proton/atoms';
import {
    DrawerAppScrollContainer,
    QuickSettingsButton,
    QuickSettingsButtonSection,
    useConfirmActionModal,
} from '@proton/components';
import DefaultQuickSettings from '@proton/components/components/drawer/views/quickSettings/DefaultQuickSettings';
import DrawerAllSettingsView from '@proton/components/components/drawer/views/quickSettings/DrawerAllSettingsView';
import { useDrive } from '@proton/drive';

import { useDebug } from '../../hooks/drive/useDebug';
import { useDiagnosticsModal } from '../../modals/DiagnosticsModal';
import { downloadLogs } from '../../utils/downloadLogs';
import ClearSearchDataButton from '../layout/search/ClearSearchDataButton';

const DriveQuickSettings = () => {
    const [confirmModal, showConfirmModal] = useConfirmActionModal();
    const { getLogs } = useDrive();
    const debug = useDebug();
    const [showDiagnosticsModal, openDiagnosticsModal] = useDiagnosticsModal();

    return (
        <DrawerAppScrollContainer>
            <DrawerAllSettingsView />

            <DefaultQuickSettings />

            <QuickSettingsButtonSection>
                <ClearSearchDataButton showConfirmModal={showConfirmModal} />
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
