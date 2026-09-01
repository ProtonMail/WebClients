import { c } from 'ttag';

import { IcCircleSlash } from '@proton/icons/icons/IcCircleSlash';
import { IcMeetBlur } from '@proton/icons/icons/IcMeetBlur';
import type { CustomBackground } from '@proton/meet/store/slices/customBackgroundsSlice';
import { MAX_BACKGROUNDS_PER_NAMESPACE, toCustomBackgroundEffect } from '@proton/meet/utils/customBackgrounds';
import {
    VIRTUAL_BACKGROUND_IDS,
    getVirtualBackgroundLabel,
    getVirtualBackgroundThumbnailUrl,
} from '@proton/meet/utils/virtualBackgrounds';

import type { BackgroundOption } from './BackgroundOptionGroup';

// Labels are built on call rather than at module scope so they follow the active locale.
export const getBackgroundEffectOptions = (): BackgroundOption[] => [
    { effect: 'none', label: c('Action').t`No effect`, icon: <IcCircleSlash size={5} /> },
    { effect: 'blur', label: c('Action').t`Blur background`, icon: <IcMeetBlur size={5} /> },
];

export const getVirtualBackgroundOptions = (): BackgroundOption[] =>
    VIRTUAL_BACKGROUND_IDS.map((id) => ({
        effect: id,
        label: getVirtualBackgroundLabel(id),
        thumbnailUrl: getVirtualBackgroundThumbnailUrl(id),
    }));

export const getAddBackgroundNotice = ({
    hasReachedLimit,
    isDriveUnavailable,
}: {
    hasReachedLimit: boolean;
    isDriveUnavailable: boolean;
}) => {
    if (isDriveUnavailable) {
        return c('Info').t`Your backgrounds could not be loaded, so a new one cannot be added right now.`;
    }

    if (!hasReachedLimit) {
        return undefined;
    }

    const max = MAX_BACKGROUNDS_PER_NAMESPACE;

    return c('Info').t`You can save up to ${max} of your own backgrounds.`;
};

export const getUnsupportedBackgroundEffectsNotice = () =>
    c('Info').t`Background effects are not supported on your browser`;

export const getCustomBackgroundOptions = (
    backgrounds: CustomBackground[],
    onDelete: (recordId: string) => Promise<void>
): BackgroundOption[] =>
    backgrounds.map(({ id, name, previewUrl, isLoading }) => ({
        effect: toCustomBackgroundEffect(id),
        label: isLoading ? c('Info').t`Adding ${name}` : name,
        thumbnailUrl: previewUrl,
        icon:
            previewUrl || isLoading ? undefined : (
                <span className="px-1 text-sm text-center text-ellipsis-two-lines text-break-all">{name}</span>
            ),
        isPlaceholder: isLoading,
        removal: isLoading
            ? undefined
            : {
                  label: c('Action').t`Remove ${name}`,
                  onRemove: () => onDelete(id),
              },
    }));
