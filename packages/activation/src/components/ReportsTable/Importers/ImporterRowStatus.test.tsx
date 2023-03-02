import { screen } from '@testing-library/dom';

import { ApiImporterError, ApiImporterState } from '@proton/activation/src/api/api.interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import ImporterRowStatus from './ImporterRowStatus';

describe('ReportRowStatus', () => {
    it('Should display PAUSED status with 100%', () => {
        easySwitchRender(
            <ImporterRowStatus processed={1} total={1} state={ApiImporterState.PAUSED} errorCode={undefined} />
        );
        screen.getByText('100% paused');
    });
    it('Should display PAUSED status', () => {
        easySwitchRender(
            <ImporterRowStatus processed={1} total={2} state={ApiImporterState.PAUSED} errorCode={undefined} />
        );
        screen.getByText('50% paused');
    });
    it('Should display PAUSED status ERROR_CODE_IMAP_CONNECTION', () => {
        easySwitchRender(
            <ImporterRowStatus
                processed={1}
                total={2}
                state={ApiImporterState.PAUSED}
                errorCode={ApiImporterError.ERROR_CODE_IMAP_CONNECTION}
            />
        );
        screen.getByTestId('ImporterRowStatus:IMAP_Error');
    });
    it('Should display PAUSED status ERROR_CODE_QUOTA_LIMIT', () => {
        easySwitchRender(
            <ImporterRowStatus
                processed={1}
                total={2}
                state={ApiImporterState.PAUSED}
                errorCode={ApiImporterError.ERROR_CODE_QUOTA_LIMIT}
            />
        );
        screen.getByTestId('ImporterRowStatus:quota_Error');
    });

    it('Should display QUEUED status', () => {
        easySwitchRender(
            <ImporterRowStatus processed={1} total={2} state={ApiImporterState.QUEUED} errorCode={undefined} />
        );
        screen.getByText('Started');
    });

    it('Should display CANCELED status', () => {
        easySwitchRender(
            <ImporterRowStatus processed={1} total={2} state={ApiImporterState.CANCELED} errorCode={undefined} />
        );
        screen.getByText('Canceling');
    });

    it('Should display DELAYED status', () => {
        easySwitchRender(
            <ImporterRowStatus processed={1} total={2} state={ApiImporterState.DELAYED} errorCode={undefined} />
        );
        screen.getByText('Delayed');
    });
});
