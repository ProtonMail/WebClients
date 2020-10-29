import { getAggregatedEventVerificationStatus } from '../../lib/calendar/decrypt';
import { EVENT_VERIFICATION_STATUS } from '../../lib/calendar/interface';

const { SUCCESSFUL, NOT_VERIFIED, FAILED } = EVENT_VERIFICATION_STATUS;

describe('reduceBooleaArray', () => {
    it('should return undefined for the empty array', () => {
        expect(getAggregatedEventVerificationStatus([])).toEqual(NOT_VERIFIED);
    });

    it('should return SUCCESSFUL when all array entries are SUCCESSFUL', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, SUCCESSFUL, SUCCESSFUL])).toEqual(SUCCESSFUL);
    });

    it('should return FAILED if some array entry is FAILED', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, NOT_VERIFIED, FAILED])).toEqual(FAILED);
        expect(getAggregatedEventVerificationStatus([FAILED, SUCCESSFUL, SUCCESSFUL])).toEqual(FAILED);
        expect(getAggregatedEventVerificationStatus([undefined, FAILED, SUCCESSFUL])).toEqual(FAILED);
    });

    it('should return undefined for any other case', () => {
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, undefined, SUCCESSFUL])).toEqual(NOT_VERIFIED);
        expect(getAggregatedEventVerificationStatus([NOT_VERIFIED, SUCCESSFUL, SUCCESSFUL])).toEqual(NOT_VERIFIED);
        expect(getAggregatedEventVerificationStatus([SUCCESSFUL, undefined, NOT_VERIFIED])).toEqual(NOT_VERIFIED);
    });
});
