import { findPendingConfirm, isAgentGenerating } from './pendingConfirm';
import type { LumoAgentItem } from './types';
import { ConfirmStatus } from './types';

const userTurn: LumoAgentItem = { id: 1, kind: 'user', text: 'archive the invoices' };
const confirmWith = (status: ConfirmStatus): LumoAgentItem => ({
    id: 2,
    kind: 'confirm',
    action: { type: 'move_items', target: 'Archive' },
    labels: {},
    status,
});
const pending = confirmWith(ConfirmStatus.PENDING);
const applied = confirmWith(ConfirmStatus.APPLIED);

describe('findPendingConfirm', () => {
    it('finds the confirm card still waiting on the user', () => {
        expect(findPendingConfirm([userTurn, applied, pending])).toBe(pending);
    });

    it('finds nothing once every card is resolved', () => {
        expect(findPendingConfirm([userTurn, applied])).toBeUndefined();
    });
});

describe('isAgentGenerating', () => {
    it('is generating while busy with no card waiting', () => {
        expect(isAgentGenerating([userTurn, applied], true)).toBe(true);
    });

    it('is not generating while a card waits on the user', () => {
        expect(isAgentGenerating([userTurn, pending], true)).toBe(false);
    });

    it('is not generating when idle', () => {
        expect(isAgentGenerating([userTurn], false)).toBe(false);
    });
});
