import { useCallback, useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { Button } from '@proton/atoms/Button/Button';
import { ButtonLikeSizeEnum } from '@proton/atoms/Button/ButtonLike';
import type { ModalStateProps } from '@proton/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { IcBrandProtonDriveFilled } from '@proton/icons/icons/IcBrandProtonDriveFilled';
import { DRIVE_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import noop from '@proton/utils/noop';

import { useDriveSDK } from '../../../hooks/useDriveSDK';
import { createThrottledProgressCallback } from '../../../util/export/exportUiHelpers';
import { DriveBrowser } from '../../Files';
import type { BreadcrumbItem } from '../../Files/DriveBrowser/DriveBreadcrumbs';
import { LumoIcon } from '../../LumoIcon/LumoIcon';
import { buildArtifactFileForSave } from './artifactFileBytes';
import type { ArtifactSaveFormat } from './artifactSaveFormats';
import { getArtifactSaveFormatLabel } from './artifactSaveFormats';
import type { ParsedArtifact } from './parseArtifacts';

interface SaveArtifactToDriveModalProps extends ModalStateProps {
    artifact: ParsedArtifact;
    format: ArtifactSaveFormat;
}

type SavePhase = 'idle' | 'preparing' | 'uploading';

const SaveArtifactToDriveModal = ({ artifact, format, ...modalProps }: SaveArtifactToDriveModalProps) => {
    const { createNotification } = useNotifications();
    const { isInitialized, uploadFile } = useDriveSDK();
    const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
    const [savePhase, setSavePhase] = useState<SavePhase>('idle');
    const [saveStatusLabel, setSaveStatusLabel] = useState('');
    const labelRef = useRef<HTMLParagraphElement>(null);
    const formatLabel = getArtifactSaveFormatLabel(format);
    const isSaving = savePhase !== 'idle';

    const currentFolder = breadcrumbs[breadcrumbs.length - 1]?.node ?? null;
    const rootFolder = breadcrumbs[0]?.node ?? null;
    const isAtRoot = !currentFolder || (rootFolder !== null && currentFolder.nodeUid === rootFolder.nodeUid);

    const updateSaveStatusLabel = useCallback((label: string) => {
        setSaveStatusLabel(label);
        if (labelRef.current) {
            labelRef.current.textContent = label;
        }
    }, []);

    const throttledPrepareProgress = useMemo(() => {
        return createThrottledProgressCallback((current, total) => {
            if (total > 1 && current > 0) {
                updateSaveStatusLabel(c('collider_2025: Info').t`Preparing ${formatLabel}… (${current} of ${total})`);
                return;
            }

            updateSaveStatusLabel(c('collider_2025: Info').t`Preparing ${formatLabel}…`);
        });
    }, [formatLabel, updateSaveStatusLabel]);

    const handleBreadcrumbsChange = useCallback((newBreadcrumbs: BreadcrumbItem[]) => {
        setBreadcrumbs(newBreadcrumbs);
    }, []);

    const handleSave = useCallback(async () => {
        if (!currentFolder || isAtRoot || isSaving) {
            return;
        }

        try {
            setSavePhase('preparing');
            updateSaveStatusLabel(c('collider_2025: Info').t`Preparing ${formatLabel}…`);

            const preparedFile = await buildArtifactFileForSave(artifact, format, {
                onProgress: throttledPrepareProgress,
            });
            const file = new File([preparedFile.data], preparedFile.fileName, { type: preparedFile.mimeType });

            setSavePhase('uploading');
            updateSaveStatusLabel(c('collider_2025: Info').t`Uploading to ${DRIVE_SHORT_APP_NAME}…`);

            await uploadFile(currentFolder.nodeUid, file, (progress) => {
                const progressPercent = Math.min(100, Math.round(progress));
                updateSaveStatusLabel(
                    c('collider_2025: Info').t`Uploading to ${DRIVE_SHORT_APP_NAME}… ${progressPercent}%`
                );
            });

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
        } finally {
            setSavePhase('idle');
            setSaveStatusLabel('');
        }
    }, [
        artifact,
        createNotification,
        currentFolder,
        format,
        formatLabel,
        isAtRoot,
        isSaving,
        modalProps,
        throttledPrepareProgress,
        updateSaveStatusLabel,
        uploadFile,
    ]);

    return (
        <ModalTwo {...modalProps} size="large" className="save-artifact-to-drive-modal">
            <ModalTwoHeader
                title={c('collider_2025:Title').t`Save to ${DRIVE_SHORT_APP_NAME}`}
                closeButtonProps={{ size: ButtonLikeSizeEnum.Tiny, disabled: isSaving }}
            />
            <ModalTwoContent>
                {!isInitialized ? (
                    <div className="flex items-center justify-center p-8">
                        <IcBrandProtonDriveFilled className="mr-2" />
                        <span>{c('collider_2025:Info').t`Initializing Drive...`}</span>
                    </div>
                ) : (
                    <div className="save-artifact-to-drive-content relative">
                        <p className="text-sm color-weak mb-3">
                            {c('collider_2025:Info')
                                .jt`Saving as ${formatLabel}. Browse to the ${DRIVE_SHORT_APP_NAME} folder you want to use, then click "Save here".`}
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
                        {isSaving && (
                            // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                            <div
                                className="artifact-export-status absolute inset-0 flex flex-column items-center justify-center gap-3"
                                role="status"
                                aria-live="polite"
                                aria-busy="true"
                            >
                                <div className="artifact-export-spinner" aria-hidden="true" />
                                <p ref={labelRef} className="text-sm color-norm m-0 text-center">
                                    {saveStatusLabel}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} color="weak" disabled={isSaving}>
                    {c('collider_2025:Button').t`Cancel`}
                </Button>
                <Button
                    onClick={() => {
                        void handleSave().catch(noop);
                    }}
                    color="norm"
                    loading={isSaving}
                    disabled={isAtRoot || isSaving}
                >
                    <span>{c('collider_2025:Button').t`Save here`}</span>
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SaveArtifactToDriveModal;
