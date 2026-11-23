import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { PaperTrailWizardShell } from './PaperTrailWizardShell';
import { type ExportPlatform, getExportPlatforms } from './exportInstructions';

interface Props {
    onBack: () => void;
    onContinue: () => void;
}

export const InstructionsStage = ({ onBack, onContinue }: Props) => {
    const [platform, setPlatform] = useState<ExportPlatform>('chatgpt');
    const guide = getExportPlatforms().find((entry) => entry.id === platform) ?? getExportPlatforms()[0];

    return (
        <PaperTrailWizardShell
            step={1}
            title={c('collider_2025:Title').t`How to export your data`}
            onBack={onBack}
            primaryLabel={c('collider_2025:Action').t`Continue`}
            onPrimary={onContinue}
        >
            {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role */}
            <div
                className="ai-paper-trail__platform-tabs p-2 radius-16"
                // eslint-disable-next-line jsx-a11y/prefer-tag-over-role
                role="group"
                aria-label={c('collider_2025:Label').t`AI platform`}
            >
                {getExportPlatforms().map((entry) => {
                    const isSelected = entry.id === platform;

                    return (
                        <button
                            key={entry.id}
                            type="button"
                            aria-pressed={isSelected}
                            aria-labelledby={`${entry.id}-platform-tab-name ${entry.id}-platform-tab-provider`}
                            className={clsx('ai-paper-trail__platform-tab gap-3 radius-12', isSelected && 'is-active')}
                            onClick={() => {
                                setPlatform(entry.id);
                            }}
                        >
                            <img src={entry.logo} alt="" className="ai-paper-trail__platform-tab-logo shrink-0" />
                            <span className="ai-paper-trail__platform-tab-copy gap-0.5">
                                <span
                                    id={`${entry.id}-platform-tab-name`}
                                    className="ai-paper-trail__platform-tab-name"
                                >
                                    {entry.name}
                                </span>
                                <span
                                    id={`${entry.id}-platform-tab-provider`}
                                    className="ai-paper-trail__platform-tab-provider lumo-body-small"
                                >
                                    {entry.provider}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <ol className="ai-paper-trail__export-steps m-0 p-0">
                {guide.steps.map((step, index) => {
                    return (
                        <li key={index} className="ai-paper-trail__export-step gap-3 px-0 lumo-body-medium">
                            <span className="ai-paper-trail__export-step-num">{index + 1}</span>
                            <span>{step}</span>
                        </li>
                    );
                })}
            </ol>

            <p className="m-0 text-left lumo-color-glyph-mid">
                {c('collider_2025:Info')
                    .t`You’ll receive your data export as a download link to your email. This may take some time depending on the size of your export, and is not available for Business or Enterprise accounts.`}
            </p>
        </PaperTrailWizardShell>
    );
};
