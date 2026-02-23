import { roundMilliseconds } from '../lib/esHelpers/esUtils';

describe('placeholder', () => {
    it('should round milliseconds', async () => {
        expect(roundMilliseconds(1644340785178)).toEqual(1644340785);
    });
});
