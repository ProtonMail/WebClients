import { screen } from '@testing-library/dom';

import { ApiImporterError, ApiImporterState } from '../../../api/api.interface';
import { easySwitchRender } from '../../../tests/render';
import ImporterRowStatus from './ImporterRowStatus';

describe('ReportRowStatus', () => {
    it('Should display PAUSED status%', () => {
        easySwitchRender(<ImporterRowStatus state={ApiImporterState.PAUSED} errorCode={undefined} />);
        screen.getByText('Paused');
    });
    it('Should display PAUSED status', () => {
        easySwitchRender(<ImporterRowStatus state={ApiImporterState.PAUSED} errorCode={undefined} />);
        screen.getByText('Paused');
    });
    it('Should display PAUSED status ERROR_CODE_IMAP_CONNECTION', () => {
        easySwitchRender(
            <ImporterRowStatus
                state={ApiImporterState.PAUSED}
                errorCode={ApiImporterError.ERROR_CODE_IMAP_CONNECTION}
            />
        );
        screen.getByTestId('ImporterRowStatus:IMAP_Error');
    });
    it('Should display PAUSED status ERROR_CODE_QUOTA_LIMIT', () => {
        easySwitchRender(
            <ImporterRowStatus state={ApiImporterState.PAUSED} errorCode={ApiImporterError.ERROR_CODE_QUOTA_LIMIT} />
        );
        screen.getByTestId('ImporterRowStatus:quota_Error');
    });

    it('Should display QUEUED status', () => {
        easySwitchRender(<ImporterRowStatus state={ApiImporterState.QUEUED} errorCode={undefined} />);
        screen.getByText('In progress...');
    });

    it('Should display CANCELED status', () => {
        easySwitchRender(<ImporterRowStatus state={ApiImporterState.CANCELED} errorCode={undefined} />);
        screen.getByText('Canceling...');
    });

    it('Should display DELAYED status', () => {
        easySwitchRender(<ImporterRowStatus state={ApiImporterState.DELAYED} errorCode={undefined} />);
        screen.getByText('Delayed');
    });
});
