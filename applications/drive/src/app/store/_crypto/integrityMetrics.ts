import { fromUnixTime } from 'date-fns';

import metrics from '@proton/metrics';

import { driveMetrics } from '../../modules/metrics';
import type { MetricUserPlan } from '../../utils/type/MetricTypes';

const REPORT_ERROR_USERS_EVERY = 5 * 60 * 1000; // 5 minutes,

// Share type string used in metrics context, do not confuse with ShareType enum.
type ShareTypeString = 'main' | 'device' | 'photo' | 'shared';
type ShareTypeStringWithPublic = ShareTypeString | 'shared_public';
type EntityType = 'share' | 'node' | 'content';
export type VerificationKey = 'ShareAddress' | 'NameSignatureEmail' | 'SignatureEmail' | 'NodeKey' | 'other';

type OptionsDecryptionError = {
    plan: MetricUserPlan;
    createTime: number | undefined;
};
type OptionsVerificationError = {
    plan: MetricUserPlan;
    createTime: number | undefined;
    addressMatchingDefaultShare: boolean | undefined;
};
type OptionsBlockVerificationError = {
    plan: MetricUserPlan;
    retryHelped: boolean;
};

export class IntegrityMetrics {
    protected metricsModule = metrics;

    private lastErroringUserReport: number;

    protected reportedShareIds: Set<string>;

    protected reportedNodeIds: Set<string>;

    constructor() {
        this.lastErroringUserReport = 0;
        this.reportedShareIds = new Set();
        this.reportedNodeIds = new Set();
    }

    shareDecryptionError(shareId: string, shareType: ShareTypeStringWithPublic, options: OptionsDecryptionError) {
        if (this.checkShareIdAlreadyReported(shareId)) {
            return;
        }
        this.reportDecryptionError('share', shareType, options);
    }

    nodeDecryptionError(nodeId: string, shareType: ShareTypeStringWithPublic, options: OptionsDecryptionError) {
        if (this.checkNodeIdAlreadyReported(nodeId)) {
            return;
        }
        this.reportDecryptionError('node', shareType, options);
    }

    contentDecryptionError(nodeId: string, shareType: ShareTypeStringWithPublic, options: OptionsDecryptionError) {
        if (this.checkNodeIdAlreadyReported(nodeId)) {
            return;
        }
        this.reportDecryptionError('content', shareType, options);
    }

    private reportDecryptionError(
        entity: EntityType,
        shareType: ShareTypeStringWithPublic,
        options: OptionsDecryptionError
    ) {
        const fromBefore2024 = getFromBefore2024(options.createTime);
        this.metricsModule.drive_integrity_decryption_errors_total.increment({
            entity,
            shareType,
            fromBefore2024,
        });
        if (fromBefore2024 === 'no') {
            driveMetrics.globalErrors.markCoreFeatureError();
            this.reportErroringUser(shareType, options.plan);
        }
    }

    signatureVerificationError(
        nodeId: string,
        shareType: ShareTypeStringWithPublic,
        verificationKey: VerificationKey,
        options: OptionsVerificationError
    ) {
        if (this.checkNodeIdAlreadyReported(nodeId)) {
            return;
        }

        const fromBefore2024 = getFromBefore2024(options.createTime);
        const addressMatchingDefaultShare = getAddressMatchingDefaultShare(options.addressMatchingDefaultShare);
        this.metricsModule.drive_integrity_verification_errors_total.increment({
            shareType,
            verificationKey,
            addressMatchingDefaultShare,
            fromBefore2024,
        });
        if (fromBefore2024 === 'no' && addressMatchingDefaultShare === 'yes') {
            driveMetrics.globalErrors.markCoreFeatureError();
            this.reportErroringUser(shareType, options.plan);
        }
    }

    nodeBlockVerificationError(
        shareType: ShareTypeStringWithPublic,
        realFileSize: number,
        options: OptionsBlockVerificationError
    ) {
        const fileSize = getFileSize(realFileSize);
        this.metricsModule.drive_integrity_block_verification_errors_total.increment({
            shareType,
            retryHelped: options.retryHelped ? 'yes' : 'no',
            fileSize,
        });
        if (!options.retryHelped) {
            driveMetrics.globalErrors.markCoreFeatureError();
            this.reportErroringUser(shareType, options.plan);
        }
    }

    private reportErroringUser(shareType: ShareTypeStringWithPublic, plan: MetricUserPlan) {
        if (Date.now() - this.lastErroringUserReport > REPORT_ERROR_USERS_EVERY) {
            this.metricsModule.drive_integrity_erroring_users_total.increment({
                shareType,
                plan,
            });
            this.lastErroringUserReport = Date.now();
        }
    }

    private checkShareIdAlreadyReported(shareId: string) {
        if (this.reportedShareIds.has(shareId)) {
            return true;
        }
        this.reportedShareIds.add(shareId);
        return false;
    }

    private checkNodeIdAlreadyReported(nodeId: string) {
        if (this.reportedNodeIds.has(nodeId)) {
            return true;
        }
        this.reportedNodeIds.add(nodeId);
        return false;
    }
}

export default new IntegrityMetrics();

export function getFromBefore2024(timestamp?: number) {
    // Both zero or undefined is considered unknown as zero is often used as unknown value.
    if (!timestamp) {
        return 'unknown';
    }
    const date = fromUnixTime(timestamp);
    if (date.getUTCFullYear() < 2024) {
        return 'yes';
    }
    return 'no';
}

export function getAddressMatchingDefaultShare(addressMatchingDefaultShare?: boolean) {
    if (addressMatchingDefaultShare !== false && addressMatchingDefaultShare !== true) {
        return 'unknown';
    }
    if (addressMatchingDefaultShare) {
        return 'yes';
    }
    return 'no';
}

export function getFileSize(realFileSize: number) {
    if (realFileSize < 2 ** 10) {
        return '2**10';
    } else if (realFileSize < 2 ** 20) {
        return '2**20';
    } else if (realFileSize < 2 ** 22) {
        return '2**22';
    } else if (realFileSize < 2 ** 25) {
        return '2**25';
    } else if (realFileSize < 2 ** 30) {
        return '2**30';
    }
    return 'xxxxl';
}
