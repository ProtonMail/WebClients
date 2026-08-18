import { screen } from '@testing-library/dom';

import { ApiSyncState } from '../../../api/api.interface';
import { easySwitchRender } from '../../../tests/render';
import SyncRowStatus from './SyncRowStatus';

describe('SyncRowStatus', () => {
    it('Should display active when status is ACTIVE', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.ACTIVE} />);
        screen.getByText('Active');
    });
    it('Should display paused when status is EXPIRED', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.EXPIRED} />);
        screen.getByText('Disabled');
    });
    it('Should display paused when status is OFFLINE', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.OFFLINE} />);
        screen.getByText('Disabled');
    });
});
