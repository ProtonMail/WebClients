import { LumoClientType } from '../types-api';
import {
    LUMO_LIMITS_ENDPOINT,
    LUMO_MODELS_ENDPOINT,
    callChatEndpoint,
    fetchModels,
    fetchUsageLimits,
    resumeChatEndpoint,
} from './network';
import { newRecoveryState } from './recovery';

describe('fetchUsageLimits', () => {
    it('calls GET ai/v1/limits and returns limits', async () => {
        const limits = { lite: 99, max: 20, images: 19 };
        const api = jest.fn().mockResolvedValue({ limits });

        await expect(fetchUsageLimits(api)).resolves.toEqual(limits);
        expect(api).toHaveBeenCalledWith({
            url: LUMO_LIMITS_ENDPOINT,
            method: 'get',
            silence: true,
        });
    });
});

describe('fetchModels', () => {
    it('calls GET ai/v1/models and returns model entries', async () => {
        const data = [
            {
                object: 'model' as const,
                id: 'lumo-lite',
                created: 1,
                owned_by: 'proton',
                max_context_length: 262_144,
            },
        ];
        const api = jest.fn().mockResolvedValue({ object: 'list', data });

        await expect(fetchModels(api)).resolves.toEqual(data);
        expect(api).toHaveBeenCalledWith({
            url: LUMO_MODELS_ENDPOINT,
            method: 'get',
            silence: true,
        });
    });
});

describe('generation recovery transport', () => {
    it('sends the per-job capability separately from the encryption request ID', async () => {
        const api = jest.fn().mockResolvedValue('stream');
        const recovery = newRecoveryState([], 'message');
        const payload = {
            model: 'lumo',
            messages: [],
            stream: true,
            lumo: { request_id: 'crypto-id', request_key: 'wrapped', client_type: LumoClientType.Frontend },
        };
        await expect(callChatEndpoint(api, payload, { recovery })).resolves.toBe('stream');
        expect(api).toHaveBeenCalledWith(
            expect.objectContaining({
                method: 'post',
                headers: { 'x-lumo-resume-token': recovery.token },
                data: { ...payload, lumo: { ...payload.lumo, job_id: recovery.jobId, resumable: true } },
            })
        );
        await resumeChatEndpoint(api, recovery);
        expect(api).toHaveBeenLastCalledWith(
            expect.objectContaining({
                url: `ai/v1/jobs/${recovery.jobId}/resume`,
                method: 'get',
                output: 'stream',
                headers: { 'x-lumo-resume-token': recovery.token },
            })
        );
        expect(payload.lumo).toEqual({
            request_id: 'crypto-id',
            request_key: 'wrapped',
            client_type: LumoClientType.Frontend,
        });
    });

    it('does not opt ordinary requests into buffering', async () => {
        const api = jest.fn().mockResolvedValue('stream');
        const payload = { model: 'lumo', messages: [], stream: true };
        await callChatEndpoint(api, payload);
        expect(api.mock.calls[0][0].data).toEqual(payload);
        expect(api.mock.calls[0][0].headers).toBeUndefined();
    });
});
