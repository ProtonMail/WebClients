import { useState } from 'react';

import { c } from 'ttag';

import { DriveImportGenericErrorStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportGenericErrorStep';
import { DriveImportInProgressStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportInProgressStep';
import { DriveImportSuccessStep } from '@proton/activation/src/components/Modals/OAuth/Drive/DriveImportSuccessStep';
import { useProductSelectionSubmit } from '@proton/activation/src/components/Modals/ProductSelectionModal/useProductSelectionSubmit';
import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '@proton/activation/src/interface';
import { Button } from '@proton/atoms/Button/Button';
import { SidebarListItem, SidebarListItemContent, navigationIconClassName } from '@proton/components';
import NewFeatureTag from '@proton/components/components/newFeatureTag/NewFeatureTag';
import { FeatureCode, useFeature } from '@proton/features';
import { IcArrowsRotate } from '@proton/icons/icons/IcArrowsRotate';
import { IcCross } from '@proton/icons/icons/IcCross';
import googleDriveLogo from '@proton/styles/assets/img/import/providers/google-drive.svg';
import clsx from '@proton/utils/clsx';

import { useDriveImportStatus } from './useDriveImportStatus';
import { useEasySwitchSidebarUserType } from './useEasySwitchSidebarUserType';

interface EasySwitchSidebarSectionProps {
    collapsed: boolean;
}

export const EasySwitchSidebarSection = ({ collapsed }: EasySwitchSidebarSectionProps) => {
    const { handleSubmit } = useProductSelectionSubmit();
    const { isLoaded, isImporting, hasCompletedImport, outcome, clearOutcome } = useDriveImportStatus();
    const [showInProgressModal, setShowInProgressModal] = useState(false);

    const { userType, showNewBadge } = useEasySwitchSidebarUserType(hasCompletedImport);

    const { feature: dismissedFeature, update: setDismissed } = useFeature<boolean>(
        FeatureCode.DriveEasySwitchSidebarDismissed
    );
    const isDismissed = !!dismissedFeature?.Value;

    const showEntry = isLoaded && !!userType && !isDismissed;

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
        <img src={googleDriveLogo} alt="" className={clsx(navigationIconClassName, 'w-4')} />
    );

    return (
        <>
            {showEntry && (
                <>
                    <SidebarListItem className="mt-4">
                        <div
                            className={clsx(
                                'flex flex-nowrap items-center justify-space-between pl-3 pr-1',
                                collapsed && 'justify-center'
                            )}
                        >
                            <span className={clsx('text-sm color-weak text-semibold', collapsed && 'sr-only')}>
                                {c('Title').t`Easy switch`}
                            </span>
                            {!collapsed && (
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="shrink-0"
                                    title={c('Action').t`Dismiss`}
                                    onClick={() => setDismissed(true)}
                                >
                                    <IcCross alt={c('Action').t`Dismiss`} />
                                </Button>
                            )}
                        </div>
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
                                    !collapsed && !isImporting && showNewBadge ? (
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
