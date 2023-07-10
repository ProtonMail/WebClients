import { screen } from '@testing-library/dom';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import SyncRowStatus from './SyncRowStatus';

describe('SyncRowStatus', () => {
    it('Should display active when status is ACTIVE', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.ACTIVE} />);
        screen.getByText('Active');
    });
    it('Should display paused when status is EXPIRED', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.EXPIRED} />);
        screen.getByText('Paused');
    });
    it('Should display paused when status is OFFLINE', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.OFFLINE} />);
        screen.getByText('Paused');
    });
});
