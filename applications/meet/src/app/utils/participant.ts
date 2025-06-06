import { ConnectionQuality } from 'livekit-client';
import { c } from 'ttag';

export function getConnectionQualityText(quality: ConnectionQuality): string {
    switch (quality) {
        case ConnectionQuality.Excellent:
            return c('l10n_nightly Info').t`Excellent`;
        case ConnectionQuality.Good:
            return c('l10n_nightly Info').t`Good`;
        case ConnectionQuality.Poor:
            return c('l10n_nightly Info').t`Poor`;
        default:
            return c('l10n_nightly Info').t`Unknown`;
    }
}
