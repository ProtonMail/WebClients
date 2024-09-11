import { IntegrityMetrics, getAddressMatchingDefaultShare, getFileSize, getFromBefore2024 } from './integrityMetrics';

class IntegrityMetricsForTesting extends IntegrityMetrics {
    setMetricsModule(metricsModule: any) {
        this.metricsModule = metricsModule;
    }

    getShareIds() {
        return this.reportedShareIds;
    }

    getNodeIds() {
        return this.reportedNodeIds;
    }
}

describe('IntegrityMetrics::', () => {
    const mockMetricsDecryptionErrors = jest.fn();
    const mockMetricsVerificationErrors = jest.fn();
    const mockMetricsBlockVerificationErrors = jest.fn();
    const mockMetricsErroringUsers = jest.fn();

    let integrityMetrics: IntegrityMetricsForTesting;

    beforeEach(() => {
        jest.resetAllMocks();
        integrityMetrics = new IntegrityMetricsForTesting();
        integrityMetrics.setMetricsModule({
            drive_integrity_decryption_errors_total: { increment: mockMetricsDecryptionErrors },
            drive_integrity_verification_errors_total: { increment: mockMetricsVerificationErrors },
            drive_integrity_block_verification_errors_total: { increment: mockMetricsBlockVerificationErrors },
            drive_integrity_erroring_users_total: { increment: mockMetricsErroringUsers },
        });
    });

    describe('shareDecryptionError', () => {
        it('reports each share only once', () => {
            integrityMetrics.shareDecryptionError('shareId1', 'main', { isPaid: false, createTime: 0 });
            integrityMetrics.shareDecryptionError('shareId1', 'main', { isPaid: false, createTime: 0 });
            integrityMetrics.shareDecryptionError('shareId2', 'device', { isPaid: false, createTime: 0 });
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledTimes(2);
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledWith({
                entity: 'share',
                shareType: 'main',
                fromBefore2024: 'unknown',
            });
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledWith({
                entity: 'share',
                shareType: 'device',
                fromBefore2024: 'unknown',
            });
        });

        it('does not call affected user if year is before 2024', () => {
            integrityMetrics.shareDecryptionError('shareId1', 'main', { isPaid: false, createTime: 1704060000 });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(0);
        });

        it('calls also affected user if year is 2024 or newer', () => {
            integrityMetrics.shareDecryptionError('shareId1', 'main', { isPaid: false, createTime: 1725544806 });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe('nodeDecryptionError', () => {
        it('reports each node only once', () => {
            integrityMetrics.nodeDecryptionError('nodeId1', 'main', { isPaid: false, createTime: 0 });
            integrityMetrics.nodeDecryptionError('nodeId1', 'main', { isPaid: false, createTime: 0 });
            integrityMetrics.nodeDecryptionError('nodeId2', 'device', { isPaid: false, createTime: 0 });
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledTimes(2);
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledWith({
                entity: 'node',
                shareType: 'main',
                fromBefore2024: 'unknown',
            });
            expect(mockMetricsDecryptionErrors).toHaveBeenCalledWith({
                entity: 'node',
                shareType: 'device',
                fromBefore2024: 'unknown',
            });
        });

        it('does not call affected user if year is before 2024', () => {
            integrityMetrics.nodeDecryptionError('nodeId1', 'main', { isPaid: false, createTime: 1704060000 });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(0);
        });

        it('calls also affected user if year is 2024 or newer', () => {
            integrityMetrics.nodeDecryptionError('nodeId1', 'main', { isPaid: false, createTime: 1725544806 });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe('signatureVerificationError', () => {
        it('reports each node only once', () => {
            integrityMetrics.signatureVerificationError('nodeId1', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 0,
                addressMatchingDefaultShare: undefined,
            });
            integrityMetrics.signatureVerificationError('nodeId1', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 0,
                addressMatchingDefaultShare: undefined,
            });
            integrityMetrics.signatureVerificationError('nodeId2', 'device', 'SignatureEmail', {
                isPaid: false,
                createTime: 0,
                addressMatchingDefaultShare: undefined,
            });
            expect(mockMetricsVerificationErrors).toHaveBeenCalledTimes(2);
            expect(mockMetricsVerificationErrors).toHaveBeenCalledWith({
                shareType: 'main',
                verificationKey: 'NodeKey',
                fromBefore2024: 'unknown',
                addressMatchingDefaultShare: 'unknown',
            });
            expect(mockMetricsVerificationErrors).toHaveBeenCalledWith({
                shareType: 'device',
                verificationKey: 'SignatureEmail',
                fromBefore2024: 'unknown',
                addressMatchingDefaultShare: 'unknown',
            });
        });

        it('does not call affected user if year is before 2024 or doesnt have matching address with default share', () => {
            integrityMetrics.signatureVerificationError('nodeId1', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 1704060000,
                addressMatchingDefaultShare: false,
            });
            integrityMetrics.signatureVerificationError('nodeId2', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 1704060000,
                addressMatchingDefaultShare: true,
            });
            integrityMetrics.signatureVerificationError('nodeId3', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 1725544806,
                addressMatchingDefaultShare: false,
            });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(0);
        });

        it('calls also affected user if year is 2024 or newer', () => {
            integrityMetrics.signatureVerificationError('nodeId1', 'main', 'NodeKey', {
                isPaid: false,
                createTime: 1725544806,
                addressMatchingDefaultShare: true,
            });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(1);
        });
    });

    describe('nodeBlockVerificationError', () => {
        it('reports each incident', () => {
            integrityMetrics.nodeBlockVerificationError('main', 1234, { isPaid: false, retryHelped: true });
            integrityMetrics.nodeBlockVerificationError('device', 1234, { isPaid: false, retryHelped: true });
            expect(mockMetricsBlockVerificationErrors).toHaveBeenCalledTimes(2);
            expect(mockMetricsBlockVerificationErrors).toHaveBeenCalledWith({
                shareType: 'main',
                retryHelped: 'yes',
                fileSize: '2**20',
            });
            expect(mockMetricsBlockVerificationErrors).toHaveBeenCalledWith({
                shareType: 'device',
                retryHelped: 'yes',
                fileSize: '2**20',
            });
        });

        it('does not call affected user if retry helped', () => {
            integrityMetrics.nodeBlockVerificationError('main', 1234, { isPaid: false, retryHelped: true });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(0);
        });

        it('calls also affected user if retry didnt help', () => {
            integrityMetrics.nodeBlockVerificationError('main', 1234, { isPaid: false, retryHelped: false });
            expect(mockMetricsErroringUsers).toHaveBeenCalledTimes(1);
        });
    });
});

describe('getFromBefore2024', () => {
    it('returns unknwon for empty time', () => {
        expect(getFromBefore2024(undefined)).toBe('unknown');
        expect(getFromBefore2024(0)).toBe('unknown');
    });

    it('returns yes for anythign before 2024', () => {
        expect(getFromBefore2024(1)).toBe('yes');
        expect(getFromBefore2024(1111111)).toBe('yes');
        expect(getFromBefore2024(1704060000)).toBe('yes'); // Dec 31, 2023
    });

    it('returns no for 2024 and later', () => {
        expect(getFromBefore2024(1704067200)).toBe('no'); // Jan 1, 2024
        expect(getFromBefore2024(1710000000)).toBe('no');
    });
});

describe('getAddressMatchingDefaultShare', () => {
    it('returns unknwon for undefined', () => {
        expect(getAddressMatchingDefaultShare(undefined)).toBe('unknown');
    });

    it('returns yes or no based on boolean value', () => {
        expect(getAddressMatchingDefaultShare(true)).toBe('yes');
        expect(getAddressMatchingDefaultShare(false)).toBe('no');
    });
});

describe('getFileSize', () => {
    it('returns proper matching size bucket', () => {
        expect(getFileSize(0)).toBe('2**10');
        expect(getFileSize(1234)).toBe('2**20');
        expect(getFileSize(123456)).toBe('2**20');
    });
});
