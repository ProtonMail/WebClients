import { screen } from '@testing-library/dom';

import { ApiImporterState, ApiReportRollbackState } from '@proton/activation/src/api/api.interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import ReportRowStatus from './ReportRowStatus';

describe('ReportRowStatus', () => {
    it('Should display paused status', () => {
        easySwitchRender(<ReportRowStatus status={ApiImporterState.PAUSED} rollbackState={undefined} />);
        screen.getByText('Paused');
    });
    it('Should display canceled status', () => {
        easySwitchRender(<ReportRowStatus status={ApiImporterState.CANCELED} rollbackState={undefined} />);
        screen.getByText('Canceled');
    });
    it('Should display Completed status', () => {
        easySwitchRender(<ReportRowStatus status={ApiImporterState.DONE} rollbackState={undefined} />);
        screen.getByText('Completed');
    });
    it('Should display FAILED status', () => {
        easySwitchRender(<ReportRowStatus status={ApiImporterState.FAILED} rollbackState={undefined} />);
        screen.getByText('Failed');
    });

    it('Should display ROLLED_BACK status', () => {
        easySwitchRender(
            <ReportRowStatus status={ApiImporterState.FAILED} rollbackState={ApiReportRollbackState.ROLLED_BACK} />
        );
        screen.getByText('Undo finished');
    });
    it('Should display ROLLING_BACK status', () => {
        easySwitchRender(
            <ReportRowStatus status={ApiImporterState.FAILED} rollbackState={ApiReportRollbackState.ROLLING_BACK} />
        );
        screen.getByText('Undo in progress');
    });
});
