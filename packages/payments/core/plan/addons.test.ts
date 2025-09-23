import { PLANS } from '../constants';
import { supportsMemberAddon } from './addons';

describe('supportsMemberAddon', () => {
    it('should return true if the plan supports member addon', () => {
        expect(supportsMemberAddon({ [PLANS.MAIL_PRO]: 1 })).toBe(true);
    });

    it('should return false if the plan does not support member addon', () => {
        expect(supportsMemberAddon({ [PLANS.MAIL]: 1 })).toBe(false);
    });
});
