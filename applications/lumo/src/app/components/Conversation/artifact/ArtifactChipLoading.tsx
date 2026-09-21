import { clsx } from 'clsx';
import { c } from 'ttag';

import { ARTIFACT_TYPE_CONFIG } from './artifactTypeConfig';

export const ArtifactChipLoading = () => {
    const Icon = ARTIFACT_TYPE_CONFIG.document.icon;

    return (
        <div
            className={clsx(
                'artifact-chip artifact-chip--loading flex flex-row items-center gap-3 border rounded-lg p-3 mt-2 mb-4 w-full text-left bg-norm border-weak'
            )}
            aria-busy="true"
            aria-live="polite"
            aria-label={c('collider_2025:Info').t`Creating artifact`}
        >
            <span className="artifact-chip-icon shrink-0 flex items-center justify-center rounded">
                <Icon size={4} aria-hidden="true" />
            </span>
            <div className="flex-1 min-w-0 flex flex-column items-start gap-0.5 text-left">
                <span className="text-sm text-semibold color-norm text-ellipsis overflow-hidden whitespace-nowrap w-full">
                    {c('collider_2025:Info').t`Creating artifact…`}
                </span>
                <span className="text-xs color-weak">{c('collider_2025:Info').t`Preparing…`}</span>
            </div>
        </div>
    );
};

export default ArtifactChipLoading;
