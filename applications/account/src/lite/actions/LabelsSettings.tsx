import { FoldersSection, LabelsSection } from '@proton/components';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

import MobileSection from '../components/MobileSection';

import './MobileSettings.scss';

interface LabelsSettingsProps {
    layout: (children: React.ReactNode, props?: any) => React.ReactNode;
    loader: React.ReactNode;
}

const LabelsSettings = ({ layout, loader }: LabelsSettingsProps) => {
    const [, loadingFolders] = useFolders();
    const [, loadingMailSettings] = useMailSettings();
    const [, loadingLabels] = useLabels();

    const loading = loadingFolders || loadingMailSettings || loadingLabels;
    if (loading) {
        return loader;
    }

    return layout(
        <div className="mobile-settings">
            <MobileSection>
                <FoldersSection showPromptOnAction />
                <LabelsSection showPromptOnAction />
            </MobileSection>
        </div>,
        { className: 'overflow-auto' }
    );
};

export default LabelsSettings;
