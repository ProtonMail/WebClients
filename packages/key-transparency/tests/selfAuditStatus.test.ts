import {
    type AddressAuditResult,
    AddressAuditStatus,
    AddressAuditWarningReason,
    type SelfAuditResult,
} from '../lib/interfaces';
import { getSelfAuditStatus } from '../lib/shared/selfAuditStatus';

const getSelfAuditResult = (result: Partial<SelfAuditResult> = {}): SelfAuditResult => {
    return {
        auditTime: 0,
        nextAuditTime: 0,
        addressAuditResults: [],
        localStorageAuditResultsOwnAddress: [],
        localStorageAuditResultsOtherAddress: [],
        ...result,
    };
};

const getAddressAudit = (status: AddressAuditStatus, warningDetails?: AddressAuditResult['warningDetails']) => {
    return { email: 'address@example.com', status, warningDetails };
};

const unverifiableHistory = { reason: AddressAuditWarningReason.UnverifiableHistory };

describe('getSelfAuditStatus', () => {
    it('shows nothing for a successful audit', () => {
        const result = getSelfAuditResult({ addressAuditResults: [getAddressAudit(AddressAuditStatus.Success)] });
        expect(getSelfAuditStatus(result)).toBeUndefined();
    });

    it('shows a failure for a failed address audit', () => {
        const result = getSelfAuditResult({ addressAuditResults: [getAddressAudit(AddressAuditStatus.Failure)] });
        expect(getSelfAuditStatus(result)).toBe('failure');
    });

    it('shows a failure for a failed local storage audit of an own or other address', () => {
        const failedAudit = { email: 'address@example.com', success: false };
        expect(getSelfAuditStatus(getSelfAuditResult({ localStorageAuditResultsOwnAddress: [failedAudit] }))).toBe(
            'failure'
        );
        expect(getSelfAuditStatus(getSelfAuditResult({ localStorageAuditResultsOtherAddress: [failedAudit] }))).toBe(
            'failure'
        );
    });

    it('prefers a failure over a warning', () => {
        const result = getSelfAuditResult({
            addressAuditResults: [
                getAddressAudit(AddressAuditStatus.Warning, { reason: AddressAuditWarningReason.AddressWithNoKeys }),
                getAddressAudit(AddressAuditStatus.Failure),
            ],
        });
        expect(getSelfAuditStatus(result)).toBe('failure');
    });

    it('shows a warning for an address without keys', () => {
        const result = getSelfAuditResult({
            addressAuditResults: [
                getAddressAudit(AddressAuditStatus.Warning, { reason: AddressAuditWarningReason.AddressWithNoKeys }),
            ],
        });
        expect(getSelfAuditStatus(result)).toBe('warning');
    });

    it('hides an unverifiable history, unless the address was disabled', () => {
        const hidden = getSelfAuditResult({
            addressAuditResults: [getAddressAudit(AddressAuditStatus.Warning, unverifiableHistory)],
        });
        const shown = getSelfAuditResult({
            addressAuditResults: [
                getAddressAudit(AddressAuditStatus.Warning, { ...unverifiableHistory, addressWasDisabled: true }),
            ],
        });
        expect(getSelfAuditStatus(hidden)).toBeUndefined();
        expect(getSelfAuditStatus(shown)).toBe('warning');
    });

    it('shows a warning after too many failed audits', () => {
        const result = getSelfAuditResult({ error: { failedTrials: 0, tooManyRetries: true } });
        expect(getSelfAuditStatus(result)).toBe('warning');
    });
});
