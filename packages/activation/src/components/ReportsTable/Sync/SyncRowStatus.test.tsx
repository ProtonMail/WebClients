import { screen } from '@testing-library/dom';

import { ApiSyncState } from '@proton/activation/src/api/api.interface';
import { easySwitchRender } from '@proton/activation/src/tests/render';

import SyncRowStatus from './SyncRowStatus';

describe('SyncRowStatus', () => {
    it('Should display paused status', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.ACTIVE} />);
        screen.getByText('Active');
    });
    it('Should display canceled status', () => {
        easySwitchRender(<SyncRowStatus state={ApiSyncState.STOPPED} />);
        screen.getByText('Paused');
    });
});
