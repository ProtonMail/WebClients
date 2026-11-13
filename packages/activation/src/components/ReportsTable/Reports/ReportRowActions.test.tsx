import { fireEvent, screen } from '@testing-library/dom';
import { vi } from 'vitest';

import { appLink } from '@proton/shared/lib/apps/appLink';
import { APPS } from '@proton/shared/lib/constants';

import { ApiImportProvider, ApiReportRollbackState } from '../../../api/api.interface';
import { ImportType } from '../../../interface';
import { easySwitchRender } from '../../../tests/render';
import ReportRowActions from './ReportRowActions';

vi.mock('@proton/shared/lib/apps/appLink', () => ({ appLink: vi.fn() }));

const IMPORT_FOLDER = { volumeID: 'volume-id', linkID: 'link-id' };

const renderActions = (importFolder?: { volumeID: string; linkID: string }, rollbackState?: ApiReportRollbackState) =>
    easySwitchRender(
        <ReportRowActions
            reportSummaryID="report-id-Drive"
            product={ImportType.DRIVE}
            provider={ApiImportProvider.GOOGLE}
            account="user@gmail.com"
            rollbackState={rollbackState}
            importFolder={importFolder}
        />
    );

describe('ReportRowActions', () => {
    it('hides "Go to folder" when the report has no import folder', () => {
        renderActions();

        expect(screen.queryByText('Go to folder')).toBeNull();
    });

    it('opens the import folder in Drive in a new tab', () => {
        renderActions(IMPORT_FOLDER);

        fireEvent.click(screen.getByText('Go to folder'));

        expect(appLink).toHaveBeenCalledWith(
            expect.objectContaining({ to: '/volume-id/link-id', toApp: APPS.PROTONDRIVE, newTab: true })
        );
    });

    it('hides "Go to folder" once the import was undone, since the folder is gone', () => {
        renderActions(IMPORT_FOLDER, ApiReportRollbackState.ROLLED_BACK);

        expect(screen.queryByText('Go to folder')).toBeNull();
    });
});
