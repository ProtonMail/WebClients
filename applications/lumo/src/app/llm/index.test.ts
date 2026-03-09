import { ENABLE_U2L_ENCRYPTION } from './index';

describe('llm encryption configuration', () => {
    it('enables U2L encryption', () => {
        expect(ENABLE_U2L_ENCRYPTION).toBe(true);
    });
});
