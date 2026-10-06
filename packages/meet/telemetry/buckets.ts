import { MINUTE, SECOND } from '@proton/shared/lib/constants';
import { sizeUnits } from '@proton/shared/lib/helpers/size';

import type {
    BackgroundSizeBucket,
    ParticipantCountBucket,
    RecordingDurationBucket,
    RecordingSizeBucket,
    WaitTimeBucket,
} from './events';

export const getBackgroundSizeBucket = (bytes: number): BackgroundSizeBucket => {
    if (bytes < sizeUnits.MB) {
        return '0-1MB';
    }
    if (bytes < 5 * sizeUnits.MB) {
        return '1-5MB';
    }
    return '5-10MB';
};

export const getWaitTimeBucket = (ms: number): WaitTimeBucket => {
    if (ms < 30 * SECOND) {
        return '0-30s';
    }
    if (ms < 2 * MINUTE) {
        return '30s-2m';
    }
    if (ms < 5 * MINUTE) {
        return '2-5m';
    }
    return '5m+';
};

export const getRecordingDurationBucket = (ms: number): RecordingDurationBucket => {
    if (ms < 5 * MINUTE) {
        return '0-5m';
    }
    if (ms < 15 * MINUTE) {
        return '5-15m';
    }
    if (ms < 30 * MINUTE) {
        return '15-30m';
    }
    if (ms < 60 * MINUTE) {
        return '30-60m';
    }
    return '60m+';
};

export const getRecordingSizeBucket = (bytes: number): RecordingSizeBucket => {
    if (bytes < 20 * sizeUnits.MB) {
        return '0-20MB';
    }
    if (bytes < 100 * sizeUnits.MB) {
        return '20-100MB';
    }
    if (bytes < 500 * sizeUnits.MB) {
        return '100-500MB';
    }
    return '500MB+';
};

export const getParticipantCountBucket = (count: number): ParticipantCountBucket => {
    if (count <= 1) {
        return '1';
    }
    if (count <= 4) {
        return '2-4';
    }
    if (count <= 10) {
        return '5-10';
    }
    if (count <= 25) {
        return '11-25';
    }
    return '26+';
};
