import { c } from 'ttag';

import { ArtifactChipShell } from './ArtifactChipShell';

export const ArtifactChipLoading = () => {
    return (
        <ArtifactChipShell
            type="document"
            className="artifact-chip--loading mt-2 mb-4"
            title={c('collider_2025:Info').t`Creating…`}
            subtitle={<span className="text-xs color-weak">{c('collider_2025:Info').t`Preparing…`}</span>}
        />
    );
};
