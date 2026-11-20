import { type Message, Role } from '../types';
import { DEFAULT_CONTEXT_LIMITS, deriveContextLimits } from './contextLimits';
import { prepareRequest } from './index';
import {
    getDisplayContextLimits,
    getFileTokenBudget,
    getRequestBudget,
    getReservedOutputTokens,
} from './requestBudget';
import { getCalibration, parseRequestedTokens, recordOverflow, recordPromptUsage } from './requestCalibration';

describe('getReservedOutputTokens', () => {
    it('reserves 10% of large windows', () => {
        expect(getReservedOutputTokens(262_144, false)).toBe(Math.round(26_214.4));
    });

    it('applies the fast and reasoning floors', () => {
        expect(getReservedOutputTokens(64_000, false)).toBe(8_000);
        expect(getReservedOutputTokens(131_072, true)).toBe(25_000);
    });

    it('never reserves more than a quarter of the window', () => {
        expect(getReservedOutputTokens(32_000, true)).toBe(8_000);
    });
});

describe('getRequestBudget', () => {
    it('includes the server prompt once when preparing a request and allocating room for files', () => {
        const budget = getRequestBudget({ limits: deriveContextLimits(20_000), calibration: 1 });
        const message: Message = {
            id: 'question',
            conversationId: 'conversation',
            createdAt: '',
            role: Role.User,
            content: 'Question',
        };
        const request = prepareRequest({ messageChain: [message], budget });

        expect(request.turns).toEqual([{ role: Role.User, content: 'Question' }]);
        expect(request.usage.instructionTokens).toBe(4_000);
        expect(request.usage.usedTokens).toBe(4_002);
        expect(budget.inputBudget).toBe(15_000);
        expect(getFileTokenBudget(budget, request.usage.usedTokens)).toBe(10_998);
    });

    it('derives every size from the window minus the reply, in estimate units', () => {
        const limits = deriveContextLimits(131_072);
        const budget = getRequestBudget({ limits, reasoning: false, calibration: 1.25 });

        expect(budget.reservedOutput).toBe(13_107);
        expect(budget.inputBudget).toBe(Math.floor((131_072 - 13_107) / 1.25));
        expect(budget.keepRecentTokens).toBe(Math.round(budget.inputBudget * 0.2));
        expect(budget.compactionTargetTokens).toBe(Math.round(budget.inputBudget * 0.5));
    });

    it('leaves no file room once history fills the input budget', () => {
        const budget = getRequestBudget({ limits: DEFAULT_CONTEXT_LIMITS });

        expect(getFileTokenBudget(budget, budget.inputBudget)).toBe(0);
        expect(getFileTokenBudget(budget, 0)).toBe(budget.inputBudget);
    });

    it('shows the window minus the reply reservation on the indicator', () => {
        const budget = getRequestBudget({ limits: deriveContextLimits(100_000) });

        expect(getDisplayContextLimits(budget).MAX_CONTEXT).toBe(90_000);
    });
});

describe('request calibration', () => {
    it('learns the ratio from backend prompt usage', () => {
        recordPromptUsage('calibrated', 10_000, 13_000);

        expect(getCalibration('calibrated')).toBeGreaterThan(1.15);
        expect(getCalibration('calibrated')).toBeLessThanOrEqual(1.3);
    });

    it('reads the requested size from vLLM overflow messages', () => {
        expect(parseRequestedTokens('However, you requested 140000 tokens (130000 in the messages')).toBe(130_000);
        expect(parseRequestedTokens('unrelated')).toBeUndefined();
    });

    it('raises the ratio after an overflow', () => {
        const before = getCalibration('overflowed');
        recordOverflow('overflowed', 10_000);

        expect(getCalibration('overflowed')).toBeGreaterThan(before);
    });
});
