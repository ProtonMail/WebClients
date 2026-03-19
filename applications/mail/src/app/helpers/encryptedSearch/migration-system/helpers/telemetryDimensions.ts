import { getContentVersion } from '../../esBuild';

const durationSecondsBuckets = (durationSeconds: number) => {
    if (durationSeconds < 10) {
        return '<10';
    }

    if (durationSeconds < 30) {
        return '<30';
    }

    if (durationSeconds < 60) {
        return '<60';
    }

    if (durationSeconds < 120) {
        return '<120';
    }

    if (durationSeconds < 180) {
        return '<180';
    }

    if (durationSeconds < 300) {
        return '<300';
    }

    return '+300';
};

export const contentCountBuckets = (contentCount: number) => {
    if (contentCount < 500) {
        return '<500';
    }

    if (contentCount < 1000) {
        return '<1000';
    }

    if (contentCount < 2000) {
        return '<2000';
    }

    if (contentCount < 5000) {
        return '<5000';
    }

    if (contentCount < 10000) {
        return '<10000';
    }

    if (contentCount < 50000) {
        return '<50000';
    }

    return '+50000';
};

export const getTelemetryDimensions = (durationSeconds: number, contentCount: number) => {
    return {
        contentVersion: getContentVersion().toString(),
        duration: durationSecondsBuckets(durationSeconds),
        migratedContents: contentCountBuckets(contentCount),
    };
};
