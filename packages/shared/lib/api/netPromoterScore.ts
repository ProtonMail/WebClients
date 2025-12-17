import type { DismissNpsRequest, SubmitNpsRequest } from '../interfaces/NetPromoterScore';

export const dismissNps = (data: DismissNpsRequest) => ({
    url: 'core/v4/nps/dismiss',
    method: 'post',
    data,
});

export const submitNps = (data: SubmitNpsRequest) => ({
    url: 'core/v4/nps/submit',
    method: 'post',
    data,
});
