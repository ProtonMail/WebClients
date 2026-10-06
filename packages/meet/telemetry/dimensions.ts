import { MeetingType } from '@proton/shared/lib/interfaces/Meet';

import type { BackgroundEffect } from '../store/slices/backgroundSlice';
import { getCustomBackgroundRecordId } from '../utils/customBackgrounds';
import { isVirtualBackgroundId } from '../utils/virtualBackgrounds';
import type { BackgroundEffectType, MeetingTypeDimension, ToggleState } from './events';

export const toToggleState = (enabled: boolean): ToggleState => (enabled ? 'on' : 'off');

const meetingTypeDimensions: Record<MeetingType, MeetingTypeDimension> = {
    [MeetingType.INSTANT]: 'instant',
    [MeetingType.PERSONAL]: 'personal',
    [MeetingType.SCHEDULED]: 'scheduled',
    [MeetingType.RECURRING]: 'recurring',
    [MeetingType.PERMANENT]: 'permanent',
};

export const getBackgroundEffectType = (effect: BackgroundEffect): BackgroundEffectType => {
    if (effect === 'blur') {
        return 'blur';
    }
    if (isVirtualBackgroundId(effect)) {
        return 'preset';
    }
    if (getCustomBackgroundRecordId(effect)) {
        return 'custom';
    }
    return 'none';
};

export const getMeetingTypeDimension = (type: MeetingType | undefined): MeetingTypeDimension =>
    (type !== undefined && meetingTypeDimensions[type]) || 'unknown';
