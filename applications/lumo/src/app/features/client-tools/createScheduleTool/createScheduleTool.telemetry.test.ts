import type { Mock } from 'vitest';

import type { PendingClientToolCall } from '@proton/lumo-api-client/core/client-tools';

import { sendScheduleDraftedInChatEvent } from '../../../util/telemetry';
import { CREATE_SCHEDULE_TOOL_NAME, createScheduleToolExecutor } from './createScheduleTool';
import { validateCreateScheduleToolArguments } from './validation';

vi.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    getDesktopScheduleConnectors: vi.fn(async () => []),
}));
vi.mock('./validation', () => ({ validateCreateScheduleToolArguments: vi.fn() }));
vi.mock('../../../util/telemetry', () => ({ sendScheduleDraftedInChatEvent: vi.fn() }));

const validate = validateCreateScheduleToolArguments as Mock;

const call = (args: string): PendingClientToolCall =>
    ({ id: 'call-1', name: CREATE_SCHEDULE_TOOL_NAME, arguments: args }) as PendingClientToolCall;

describe('create_schedule drafted telemetry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('counts a draft once it passes validation', async () => {
        validate.mockReturnValue({ ok: true, value: {} });

        const [result] = await createScheduleToolExecutor.execute([call('{}')]);

        expect(result.is_error).toBeFalsy();
        expect(sendScheduleDraftedInChatEvent).toHaveBeenCalledTimes(1);
    });

    it('does not count drafts the user never sees', async () => {
        validate.mockReturnValue({ ok: false, error: 'name: required' });

        await createScheduleToolExecutor.execute([call('{}'), call('not json')]);

        expect(sendScheduleDraftedInChatEvent).not.toHaveBeenCalled();
    });
});
