import { useState } from 'react';

import { clsx } from 'clsx';
import { c } from 'ttag';

import { PaperTrailWizardShell } from './PaperTrailWizardShell';
import { EXPORT_PLATFORMS, type ExportPlatform } from './exportInstructions';

interface Props {
    onBack: () => void;
    onContinue: () => void;
}

export const InstructionsStage = ({ onBack, onContinue }: Props) => {
    const [platform, setPlatform] = useState<ExportPlatform>('chatgpt');
    const guide = EXPORT_PLATFORMS.find((entry) => entry.id === platform) ?? EXPORT_PLATFORMS[0];

    return (
        <PaperTrailWizardShell
            step={1}
            title={c('collider_2025:Title').t`How to export your data`}
            onBack={onBack}
            primaryLabel={c('collider_2025:Action').t`Continue`}
            onPrimary={onContinue}
        >
            <div className="ai-paper-trail__platform-tabs" role="tablist">
                {EXPORT_PLATFORMS.map((entry) => {
                    const isSelected = entry.id === platform;

                    return (
                        <button
                            key={entry.id}
                            type="button"
                            role="tab"
                            aria-label={entry.name}
                            aria-selected={isSelected}
                            className={clsx('ai-paper-trail__platform-tab', isSelected && 'is-active')}
                            onClick={() => {
                                setPlatform(entry.id);
                            }}
                        >
                            <img src={entry.logo} alt="" className="ai-paper-trail__platform-tab-logo shrink-0" />
                            <span className="ai-paper-trail__platform-tab-copy">
                                <span className="ai-paper-trail__platform-tab-name">{entry.name}</span>
                                <span className="ai-paper-trail__platform-tab-provider">{entry.provider}</span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <ol className="ai-paper-trail__export-steps">
                {guide.steps.map((step, index) => {
                    return (
                        <li key={index} className="ai-paper-trail__export-step">
                            <span className="ai-paper-trail__export-step-num">{index + 1}</span>
                            <span>{step}</span>
                        </li>
                    );
                })}
            </ol>

            <p className="color-weak text-left m-0">
                {c('collider_2025:Info')
                    .t`You’ll receive your data export as a download link to your email. This may take some time depending on the size of your export, and is not available for Business or Enterprise accounts.`}
            </p>
        </PaperTrailWizardShell>
    );
};
