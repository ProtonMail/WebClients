import { getDriveNodePath } from './getDriveNodePath';

describe('getDriveNodePath', () => {
    it('builds the volume-based Drive path of a node', () => {
        expect(getDriveNodePath('volume-id', 'link-id')).toBe('/volume-id/link-id');
    });
});
