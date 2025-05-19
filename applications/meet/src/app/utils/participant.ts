import { ConnectionQuality } from 'livekit-client';
import { c } from 'ttag';

export function getConnectionQualityText(quality: ConnectionQuality): string {
    switch (quality) {
        case ConnectionQuality.Excellent:
            return c('Meet').t`Excellent`;
        case ConnectionQuality.Good:
            return c('Meet').t`Good`;
        case ConnectionQuality.Poor:
            return c('Meet').t`Poor`;
        default:
            return c('Meet').t`Unknown`;
    }
}
