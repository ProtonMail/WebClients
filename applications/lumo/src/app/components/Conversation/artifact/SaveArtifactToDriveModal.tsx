import { useCallback, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, useNotifications } from '@proton/components';
import { useLoading } from '@proton/hooks';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useDriveSDK } from '../../../hooks/useDriveSDK';
import { DriveBrowser } from '../../Files';
import type { BreadcrumbItem } from '../../Files/DriveBrowser/DriveBreadcrumbs';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';
import type { ParsedArtifact } from './parseArtifacts';

interface SaveArtifactToDriveModalProps extends ModalStateProps {
    artifact: ParsedArtifact;
}

const SaveArtifactToDriveModal = ({ artifact, ...modalProps }: SaveArtifactToDriveModalProps) => {
    const { createNotification } = useNotifications();
    const { isInitialized, uploadFile } = useDriveSDK();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [loading, withLoading] = useLoading();

    // Derive current folder state from breadcrumbs — updates on both forward and back navigation
    const currentFolder = breadcrumbs[breadcrumbs.length - 1]?.node ?? null;
    const rootFolder = breadcrumbs[0]?.node ?? null;
    const isAtRoot = !currentFolder || (rootFolder !== null && currentFolder.nodeUid === rootFolder.nodeUid);

    const handleBreadcrumbsChange = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
        setBreadcrumbs(newBreadcrumbs);
    }, []);

    const handleSave = useCallback(async () => {
        if (!currentFolder || isAtRoot) {
            return;
        }

        try {
            const ext = ARTIFACT_TYPE_CONFIG.document.downloadExt(artifact);
            const filename = `${artifact.title.toLowerCase().replace(/\s+/g, '-')}.${ext}`;
            const file = new File([artifact.content], filename, { type: 'text/markdown' });

            await uploadFile(currentFolder.nodeUid, file);

            createNotification({
                text: c('collider_2025:Success').t`Saved to ${DRIVE_SHORT_APP_NAME}`,
                type: 'success',
            });

            modalProps.onClose?.();
        } catch (error) {
            console.error('Failed to save artifact to Drive:', error);
            createNotification({
                text: error instanceof Error ? error.message : c('collider_2025:Error').t`Failed to save file`,
                type: 'error',
            });
        }
    }, [currentFolder, isAtRoot, artifact, uploadFile, createNotification, modalProps]);

    return (
        <ModalTwo {...modalProps} size="large" className="save-artifact-to-drive-modal">
            <ModalTwoHeader
                title={c('collider_2025:Title').t`Save to ${DRIVE_SHORT_APP_NAME}`}
                closeButtonProps={{ size: ButtonLikeSizeEnum.Tiny, disabled: loading }}
            />
            <ModalTwoContent>
                {!isInitialized ? (
                    <div className="flex items-center justify-center p-8">
                        <IcBrandProtonDriveFilled className="mr-2" />
                        <span>{c('collider_2025:Info').t`Initializing Drive...`}</span>
                    </div>
                ) : (
                    <div className="save-artifact-to-drive-content">
                        <p className="text-sm color-weak mb-3">
                            {c('collider_2025:Info')
                                .jt`Browse to the ${DRIVE_SHORT_APP_NAME} folder you want to save this document to, then click "Save here".`}
                        </p>
                        <div className="border border-weak rounded overflow-hidden" style={{ height: '22rem' }}>
                            <DriveBrowser
                                onFileSelect={() => {}}
                                folderSelectionMode={true}
                                initialShowDriveBrowser={true}
                                hideHeader={true}
                                onBreadcrumbsChange={handleBreadcrumbsChange}
                            />
                        </div>
                        {!isAtRoot && currentFolder && (
                            <div className="mt-3 flex items-center gap-2 text-sm">
                                <LumoIcon name="Folder" size={16} className="color-norm shrink-0" />
                                <span className="color-weak">{c('collider_2025:Label').t`Selected:`}</span>
                                <span className="text-bold">{currentFolder.name}</span>
                            </div>
                        )}
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} color="weak" disabled={loading}>
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button
                    onClick={() => withLoading(handleSave()).catch(noop)}
                    color="norm"
                    loading={loading}
                    disabled={isAtRoot}
                >
                    <span>{c('collider_2025:Button').t`Save here`}</span>
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SaveArtifactToDriveModal;
