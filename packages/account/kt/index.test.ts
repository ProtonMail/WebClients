import { AddressAuditStatus, type SelfAuditResult } from '@proton/key-transparency/interfaces';
import { KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';

import { type KtState, selectKTSelfAuditStatus } from './index';

const failedSelfAuditResult: SelfAuditResult = {
    auditTime: 0,
    nextAuditTime: 0,
    addressAuditResults: [{ email: 'address@example.com', status: AddressAuditStatus.Failure }],
    localStorageAuditResultsOwnAddress: [],
    localStorageAuditResultsOtherAddress: [],
};

const getState = (value: KeyTransparencyActivation, selfAuditResult?: SelfAuditResult): KtState => {
    return { kt: { value, selfAuditResult } };
};

describe('selectKTSelfAuditStatus', () => {
    it('shows the status of the last audit when key transparency is shown in the UI', () => {
        expect(selectKTSelfAuditStatus(getState(KeyTransparencyActivation.SHOW_UI, failedSelfAuditResult))).toBe(
            'failure'
        );
    });

    it('shows nothing when key transparency only logs', () => {
        expect(
            selectKTSelfAuditStatus(getState(KeyTransparencyActivation.LOG_ONLY, failedSelfAuditResult))
        ).toBeUndefined();
    });

    it('shows nothing before the first audit', () => {
        expect(selectKTSelfAuditStatus(getState(KeyTransparencyActivation.SHOW_UI))).toBeUndefined();
    });
});
