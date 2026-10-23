import { screen } from '@testing-library/dom';

import { ApiImporterError, ApiImporterState } from '../../../api/api.interface';
import { ImportType } from '../../../interface';
import { easySwitchRender } from '../../../tests/render';
import ImporterRowStatus from './ImporterRowStatus';

describe('ReportRowStatus', () => {
    it('Should display PAUSED status%', () => {
        easySwitchRender(
            <ImporterRowStatus product={ImportType.MAIL} state={ApiImporterState.PAUSED} errorCode={undefined} />
        );
        screen.getByText('Paused');
    });
    it('Should display PAUSED status', () => {
        easySwitchRender(
            <ImporterRowStatus product={ImportType.MAIL} state={ApiImporterState.PAUSED} errorCode={undefined} />
        );
        screen.getByText('Paused');
    });
    it('Should display PAUSED status ERROR_CODE_IMAP_CONNECTION', () => {
        easySwitchRender(
            <ImporterRowStatus
                product={ImportType.MAIL}
                state={ApiImporterState.PAUSED}
                errorCode={ApiImporterError.ERROR_CODE_IMAP_CONNECTION}
            />
        );
        screen.getByTestId('ImporterRowStatus:IMAP_Error');
    });
    it('Should display PAUSED status ERROR_CODE_QUOTA_LIMIT', () => {
        easySwitchRender(
            <ImporterRowStatus
                product={ImportType.MAIL}
                state={ApiImporterState.PAUSED}
                errorCode={ApiImporterError.ERROR_CODE_QUOTA_LIMIT}
            />
        );
        screen.getByTestId('ImporterRowStatus:quota_Error');
    });

    it('Should display QUEUED status', () => {
        easySwitchRender(
            <ImporterRowStatus product={ImportType.MAIL} state={ApiImporterState.QUEUED} errorCode={undefined} />
        );
        screen.getByText('In progress...');
    });

    it('Should display CANCELED status', () => {
        easySwitchRender(
            <ImporterRowStatus product={ImportType.MAIL} state={ApiImporterState.CANCELED} errorCode={undefined} />
        );
        screen.getByText('Canceling...');
    });

    it('Should display DELAYED status', () => {
        easySwitchRender(
            <ImporterRowStatus product={ImportType.MAIL} state={ApiImporterState.DELAYED} errorCode={undefined} />
        );
        screen.getByText('Delayed');
    });

    it.each([ApiImporterState.DONE, ApiImporterState.FAILED])('Should display %s as in progress', (state) => {
        easySwitchRender(<ImporterRowStatus product={ImportType.MAIL} state={state} errorCode={undefined} />);
        screen.getByText('In progress...');
    });
});
