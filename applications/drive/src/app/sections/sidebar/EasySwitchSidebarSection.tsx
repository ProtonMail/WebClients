import { useState } from 'react';

import { c } from 'ttag';

import { DriveImportGenericErrorStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportGenericErrorStep';
import { DriveImportInProgressStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportInProgressStep';
import { DriveImportSuccessStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportSuccessStep';
import { useProductSelectionSubmit } from '@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { SidebarListItem, SidebarListItemContent, navigationIconClassName } from '@proton/components';
import NewFeatureTag from '@proton/components/components/newFeatureTag/NewFeatureTag';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import googleDriveLogo from '@proton/styles/assets/img/import/providers/google-drive.svg';
import clsx from '@proton/utils/clsx';

import { useDriveImportStatus } from './useDriveImportStatus';

interface EasySwitchSidebarSectionProps {
    collapsed: boolean;
}

export const EasySwitchSidebarSection = ({ collapsed }: EasySwitchSidebarSectionProps) => {
    const { handleSubmit } = useProductSelectionSubmit();
    const { isLoaded, isImporting, hasCompletedImport, outcome, clearOutcome } = useDriveImportStatus();
    const [showInProgressModal, setShowInProgressModal] = useState(false);

    // TODO: Add more conditions, like 30 days after feature launch / 30 days after volume creation.
    // We also need to check for failed imports if we want to show the entry again.
    const showEntry = isLoaded && !hasCompletedImport;

    const label = isImporting ? c('Action').t`Importing from Google` : c('Action').t`Import from Google`;

    const handleClick = () => {
        if (isImporting) {
            setShowInProgressModal(true);
            return;
        }
        handleSubmit(ImportProvider.GOOGLE, [ImportType.DRIVE], EASY_SWITCH_SOURCES.DRIVE_WEB_SIDEBAR);
    };

    const icon = isImporting ? (
        <IcArrowsRotate alt="" className={clsx(navigationIconClassName, 'easy-switch-sidebar-icon--spinning')} />
    ) : (
        <img src={googleDriveLogo} alt="Google Drive" className={clsx(navigationIconClassName, 'w-4')} />
    );

    return (
        <>
            {showEntry && (
                <>
                    <SidebarListItem className="mt-4">
                        <span className={clsx('text-sm color-weak text-semibold pl-3', collapsed && 'sr-only')}>
                            {c('Title').t`Easy switch`}
                        </span>
                    </SidebarListItem>
                    <SidebarListItem>
                        <button
                            type="button"
                            className="navigation-link w-full text-left"
                            aria-label={label}
                            onClick={handleClick}
                        >
                            <SidebarListItemContent
                                className={clsx('flex flex-nowrap', collapsed && 'justify-center')}
                                collapsed={collapsed}
                                left={icon}
                                right={
                                    !collapsed && !isImporting ? (
                                        <NewFeatureTag featureKey="drive-easy-switch-sidebar" />
                                    ) : undefined
                                }
                            >
                                <span className="text-ellipsis">{label}</span>
                            </SidebarListItemContent>
                        </button>
                    </SidebarListItem>
                </>
            )}
            {showInProgressModal && !outcome && (
                <DriveImportInProgressStep onClose={() => setShowInProgressModal(false)} />
            )}
            {outcome === 'success' && (
                <DriveImportSuccessStep
                    onClose={() => {
                        setShowInProgressModal(false);
                        clearOutcome();
                    }}
                />
            )}
            {outcome === 'failed' && (
                <DriveImportGenericErrorStep
                    onClose={() => {
                        setShowInProgressModal(false);
                        clearOutcome();
                    }}
                />
            )}
        </>
    );
};
