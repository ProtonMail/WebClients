import { ApiImporterState, ApiReportRollbackState } from '../../../api/api.interface';
import { getImporterString, getReportString, getRollbackStateString } from './reportStrings';

describe('reportStrings', () => {
    it('Should not return a report string for in-flight states', () => {
        expect(getReportString(ApiImporterState.RUNNING)).toBeUndefined();
        expect(getReportString(ApiImporterState.DELAYED)).toBeUndefined();
    });

    it('Should not return an importer string for finished states', () => {
        expect(getImporterString(ApiImporterState.DONE)).toBeUndefined();
        expect(getImporterString(ApiImporterState.FAILED)).toBeUndefined();
    });

    it('Should not return a rollback string when nothing is happening', () => {
        expect(getRollbackStateString(ApiReportRollbackState.CAN_ROLLBACK)).toBeUndefined();
        expect(getRollbackStateString(ApiReportRollbackState.CANNOT_ROLLBACK)).toBeUndefined();
    });
});
