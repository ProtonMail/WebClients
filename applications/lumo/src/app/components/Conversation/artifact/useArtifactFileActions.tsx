import { useMemo, useRef, useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import useModalState from '@proton/components/components/modalTwo/useModalState';

import { useIsGuest } from '../../../providers/IsGuestProvider';
import { createThrottledProgressCallback, yieldToMainThreadPaint } from '../../../util/export/exportUiHelpers';
import { downloadBlob } from '../../../util/pdf/downloadBlob';
import { bucketArtifactContentLength, sendArtifactDownloadedEvent } from '../../../util/telemetry';
import type { ArtifactDownloadFormat, ArtifactDownloadLayout, ArtifactDownloadResult } from '../../../util/telemetry';
import type { IconName } from '../../LumoIcon/LumoIcon';
import type { ArtifactMenuFormatOption } from './ArtifactActionsDropdown';
import type { ArtifactExportOverlayHandle } from './ArtifactExportOverlay';
import SaveArtifactToDriveModal from './SaveArtifactToDriveModal';
import { buildArtifactFileForSave } from './artifactFileBytes';
import { artifactSupportsPdfExport, exportArtifactPdf } from './artifactPdfExport';
import type { ArtifactPdfExportResult } from './artifactPdfExport';
import { artifactSupportsPptxExport, downloadArtifactPptx } from './artifactPptxExport';
import type { ArtifactSaveFormat } from './artifactSaveFormats';
import {
    artifactSupportsSaveToDrive,
    getArtifactFormatMenuLabel,
    getArtifactSaveFormats,
    getArtifactSourceMenuLabel,
    isArtifactSaveFormatSupported,
} from './artifactSaveFormats';
import { buildArtifactSourceDownloadFile } from './artifactSourceDownload';
import type { ArtifactSourceDownloadFile } from './artifactSourceDownload';
import { getArtifactSourceDownloadExtension } from './artifactSourceDownloadExtension';
import type { ParsedArtifact } from './parseArtifacts';

export type ArtifactExportKind = 'pdf' | 'pptx';

const SAVE_FORMAT_ICONS: Record<ArtifactSaveFormat, IconName> = {
    md: 'FileText',
    txt: 'FileText',
    pdf: 'File',
    docx: 'FileType',
    pptx: 'Presentation',
};

const getPdfDownloadTelemetryResult = (result: ArtifactPdfExportResult): ArtifactDownloadResult => {
    if (result === 'unavailable' || result === 'failed') {
        return 'error';
    }

    return result;
};

const getFileExtension = (fileName: string): string | undefined => {
    return fileName.match(/\.([a-z0-9+]+)$/i)?.[1]?.toLowerCase();
};

interface Options {
    artifact: ParsedArtifact | undefined;
    layout: ArtifactDownloadLayout;
    viewedOlderVersion: boolean;
    /** Word, PDF and PowerPoint downloads can't run right now, e.g. while the artifact generates. */
    exportsDisabled?: boolean;
    /** Offer only the source file: `artifact.content` isn't the artifact's own (a synced deck is built HTML). */
    sourceOnly?: boolean;
    /** A ready-made source file, downloaded as is instead of being rebuilt from the artifact. */
    sourceFile?: ArtifactSourceDownloadFile;
}

/**
 * Download and Save to Drive for an artifact: the menu options, the handlers behind them, the
 * export in progress (for an overlay), and the Drive modal to render.
 */
export function useArtifactFileActions({
    artifact,
    layout,
    viewedOlderVersion,
    exportsDisabled = false,
    sourceOnly = false,
    sourceFile,
}: Options) {
    const { createNotification } = useNotifications();
    const isGuest = useIsGuest();
    const [exportingKind, setExportingKind] = useState<ArtifactExportKind | null>(null);
    const exportOverlayRef = useRef<ArtifactExportOverlayHandle>(null);
    const throttledExportProgress = useMemo(() => {
        return createThrottledProgressCallback((current, total) => {
            exportOverlayRef.current?.updateProgress(current, total);
        });
    }, []);
    const [saveToDriveModalProps, setSaveToDriveModalOpen, renderSaveToDriveModal] = useModalState();
    const [saveToDriveFormat, setSaveToDriveFormat] = useState<ArtifactSaveFormat>('md');

    const exportFormatLabel =
        exportingKind === 'pptx' ? c('collider_2025: Info').t`PPTX` : c('collider_2025: Info').t`PDF`;

    if (!artifact) {
        return {
            downloadOptions: [] as ArtifactMenuFormatOption[],
            saveToDriveOptions: [] as ArtifactMenuFormatOption[],
            exportingKind,
            exportFormatLabel,
            exportOverlayRef,
            saveToDriveModal: null,
        };
    }

    const reportDownload = (format: ArtifactDownloadFormat, result: ArtifactDownloadResult) => {
        sendArtifactDownloadedEvent({
            format,
            artifactType: artifact.type,
            layout,
            result,
            contentLengthBucket: bucketArtifactContentLength(artifact.content.length),
            viewedOlderVersion,
        });
    };

    const handleDownloadSource = async () => {
        try {
            const { data, fileName, mimeType } = sourceFile ?? (await buildArtifactSourceDownloadFile(artifact));
            downloadBlob(new Blob([data], { type: mimeType }), fileName);
            reportDownload('source', 'success');
        } catch {
            reportDownload('source', 'error');
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not download this file.`,
            });
        }
    };

    // No progress overlay: conversion takes well under a second for typical documents, and the
    // overlay would only flash. The error toast covers the chunk failing to load.
    const handleDownloadDocx = async () => {
        try {
            const file = await buildArtifactFileForSave(artifact, 'docx');
            downloadBlob(new Blob([file.data], { type: file.mimeType }), file.fileName);
            reportDownload('docx', 'success');
        } catch {
            reportDownload('docx', 'error');
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not export as a Word document.`,
            });
        }
    };

    const handleDownloadPdf = async () => {
        setExportingKind('pdf');
        await yieldToMainThreadPaint();

        let result: ArtifactPdfExportResult = 'failed';
        try {
            result = await exportArtifactPdf(artifact, {
                onProgress: throttledExportProgress,
            });
        } catch {
            result = 'failed';
        } finally {
            setExportingKind(null);
        }

        reportDownload('pdf', getPdfDownloadTelemetryResult(result));

        if (result === 'success') {
            createNotification({
                type: 'success',
                text: c('collider_2025: Info').t`PDF downloaded.`,
            });
        } else if (result === 'print_dialog') {
            // No toast: the print dialog is the feedback, and in Chrome it blocks until closed, so a
            // toast would only appear after the user has already saved or cancelled.
        } else if (result === 'print_fallback') {
            createNotification({
                type: 'warning',
                text: c('collider_2025: Info')
                    .t`PDF export failed — opened the print view instead. Choose “Save as PDF” in the print dialog.`,
            });
        } else if (result === 'image_fallback') {
            createNotification({
                type: 'warning',
                text: c('collider_2025: Info')
                    .t`Couldn't open the print dialog, so the PDF was downloaded with each page as an image.`,
            });
        } else {
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not export as PDF.`,
            });
        }
    };

    const handleDownloadPptx = async () => {
        setExportingKind('pptx');
        await yieldToMainThreadPaint();
        try {
            const result = await downloadArtifactPptx(artifact, {
                onProgress: throttledExportProgress,
            });
            if (result === 'success') {
                reportDownload('pptx', 'success');
                createNotification({
                    type: 'success',
                    text: c('collider_2025: Info').t`PPTX downloaded.`,
                });
            } else {
                reportDownload('pptx', 'error');
                createNotification({
                    type: 'error',
                    text: c('collider_2025: Error').t`Could not export as PPTX.`,
                });
            }
        } catch {
            reportDownload('pptx', 'error');
            createNotification({
                type: 'error',
                text: c('collider_2025: Error').t`Could not export as PPTX.`,
            });
        } finally {
            setExportingKind(null);
        }
    };

    const canExport = !sourceOnly && !exportsDisabled;
    const sourceExtension =
        (sourceFile && getFileExtension(sourceFile.fileName)) ?? getArtifactSourceDownloadExtension(artifact);
    // Source (what the Library syncs) first, then the exports this type supports.
    const downloadOptions: ArtifactMenuFormatOption[] = [
        {
            key: 'source',
            label: getArtifactSourceMenuLabel(artifact.type),
            extension: `.${sourceExtension}`,
            icon: artifact.type === 'document' ? 'FileText' : 'FileCode',
            onSelect: () => {
                void handleDownloadSource();
            },
        },
    ];
    if (canExport && artifactSupportsPdfExport(artifact.type)) {
        downloadOptions.push({
            key: 'pdf',
            label: getArtifactFormatMenuLabel('pdf'),
            extension: '.pdf',
            icon: SAVE_FORMAT_ICONS.pdf,
            onSelect: () => {
                void handleDownloadPdf();
            },
        });
    }
    if (canExport && isArtifactSaveFormatSupported(artifact.type, 'docx')) {
        downloadOptions.push({
            key: 'docx',
            label: getArtifactFormatMenuLabel('docx'),
            extension: '.docx',
            icon: SAVE_FORMAT_ICONS.docx,
            onSelect: () => {
                void handleDownloadDocx();
            },
        });
    }
    if (canExport && artifactSupportsPptxExport(artifact.type)) {
        downloadOptions.push({
            key: 'pptx',
            label: getArtifactFormatMenuLabel('pptx'),
            extension: '.pptx',
            icon: SAVE_FORMAT_ICONS.pptx,
            onSelect: () => {
                void handleDownloadPptx();
            },
        });
    }

    const saveFormats =
        !sourceOnly && !isGuest && artifactSupportsSaveToDrive(artifact.type)
            ? getArtifactSaveFormats(artifact.type)
            : [];
    const saveToDriveOptions: ArtifactMenuFormatOption[] = saveFormats.map((format) => {
        return {
            key: format,
            label: getArtifactFormatMenuLabel(format),
            extension: `.${format}`,
            icon: SAVE_FORMAT_ICONS[format],
            onSelect: () => {
                setSaveToDriveFormat(format);
                setSaveToDriveModalOpen(true);
            },
        };
    });

    const saveToDriveModal =
        saveFormats.length > 0 && renderSaveToDriveModal ? (
            <SaveArtifactToDriveModal {...saveToDriveModalProps} artifact={artifact} format={saveToDriveFormat} />
        ) : null;

    return {
        downloadOptions,
        saveToDriveOptions,
        exportingKind,
        exportFormatLabel,
        exportOverlayRef,
        saveToDriveModal,
    };
}
