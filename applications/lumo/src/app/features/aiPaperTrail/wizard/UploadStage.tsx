import { useRef, useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import { PAPER_TRAIL_LIMITS } from '../buildPaperTrailContext';
import { GuestLocalSaveOption } from './GuestLocalSaveOption';
import { PaperTrailWizardShell } from './PaperTrailWizardShell';

const ACCEPTED = '.json,.zip,application/json,application/zip';

interface Props {
    error?: string;
    saveLocallyEnabled: boolean;
    onSaveLocallyChange: (enabled: boolean) => void;
    onBack: () => void;
    onGenerate: (file: File) => void;
}

export const UploadStage = ({ error, saveLocallyEnabled, onSaveLocallyChange, onBack, onGenerate }: Props) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | undefined>();
    const [validationError, setValidationError] = useState<string | undefined>();

    const handleFileSelect = (file: File | undefined) => {
        setSelectedFile(file);
        setValidationError(undefined);
    };

    const handleGenerate = () => {
        if (!selectedFile) {
            setValidationError(c('collider_2025:Info').t`Please upload your AI export before continuing.`);
            return;
        }

        onGenerate(selectedFile);
    };

    const displayError = validationError ?? (selectedFile ? undefined : error);

    return (
        <PaperTrailWizardShell
            step={2}
            title={c('collider_2025:Title').t`Upload your data export`}
            onBack={onBack}
            primaryLabel={c('collider_2025:Action').t`Generate my report`}
            onPrimary={handleGenerate}
        >
            <p className="ai-paper-trail__wizard-lead">
                {c('collider_2025:Info')
                    .t`Choose or drop your .zip or conversations.json file. We analyze your ${PAPER_TRAIL_LIMITS.maxPrompts} most recent prompts.`}
            </p>

            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div
                className={clsx('ai-paper-trail__dropzone', isDragging && 'is-dragging', selectedFile && 'has-file')}
                role="button"
                tabIndex={0}
                onClick={() => {
                    inputRef.current?.click();
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        inputRef.current?.click();
                    }
                }}
                onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragging(true);
                }}
                onDragLeave={() => {
                    setIsDragging(false);
                }}
                onDrop={(event) => {
                    event.preventDefault();
                    setIsDragging(false);
                    handleFileSelect(event.dataTransfer.files?.[0]);
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={ACCEPTED}
                    className="sr-only"
                    onChange={(event) => {
                        handleFileSelect(event.target.files?.[0]);
                        event.target.value = '';
                    }}
                />
                <div className="flex flex-column items-center gap-3 text-center">
                    <LumoIcon name="Upload" size={32} className="ai-paper-trail__upload-icon" />
                    <span className="text-lg text-semibold">{c('collider_2025:Action').t`Upload your AI export`}</span>
                    {selectedFile ? (
                        <span className="ai-paper-trail__selected-file text-sm">{selectedFile.name}</span>
                    ) : (
                        <span className="ai-paper-trail__muted text-sm">
                            {c('collider_2025:Info').t`Drag and drop or click to browse`}
                        </span>
                    )}
                </div>
            </div>

            {displayError && (
                <div className="ai-paper-trail__error flex flex-row flex-nowrap items-start gap-2 mt-0 p-3 rounded">
                    <LumoIcon name="CircleAlert" size={16} className="color-danger shrink-0 mt-0.5" />
                    <span>{displayError}</span>
                </div>
            )}

            <div className="ai-paper-trail__privacy flex flex-row flex-nowrap items-center gap-2">
                <LumoIcon name="Lock" size={16} className="shrink-0" />
                <span className="text-sm color-weak text-semibold">
                    {c('collider_2025:Info')
                        .t`Your export is encrypted in transit and processed without being stored on ${LUMO_SHORT_APP_NAME}'s servers.`}
                </span>
            </div>

            <GuestLocalSaveOption enabled={saveLocallyEnabled} onChange={onSaveLocallyChange} />
        </PaperTrailWizardShell>
    );
};
