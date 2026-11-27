import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms/InlineLinkButton/InlineLinkButton';
import TopBanner from '@proton/components/containers/topBanners/TopBanner';
import { useMeetSelector } from '@proton/meet/store/hooks';
import { selectAudioPlaybackStatus } from '@proton/meet/store/slices/deviceManagementSlice/selectors';
import { reloadWindow } from '@proton/shared/lib/helpers/location';

export const AudioPlaybackFrozenBanner = () => {
    const isAudioPlaybackFrozen = useMeetSelector(selectAudioPlaybackStatus) === 'frozen';

    if (!isAudioPlaybackFrozen) {
        return null;
    }

    return (
        <TopBanner
            className="bg-danger"
            innerClassName="flex flex-nowrap items-center justify-center gap-2 text-semibold color-invert"
            data-testid="audio-frozen-banner"
        >
            <span>{c('Info').t`Audio stopped working. You can’t hear others and they can’t hear you.`}</span>
            <InlineLinkButton
                className="color-inherit"
                style={{ '--focus-outline': 'currentcolor' }}
                onClick={reloadWindow}
            >
                {c('Action').t`Reload`}
            </InlineLinkButton>
        </TopBanner>
    );
};
