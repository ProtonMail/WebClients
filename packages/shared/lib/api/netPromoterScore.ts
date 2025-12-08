import type { SubmitNpsRequest } from '../interfaces/NetPromoterScore';

export const dismissNps = () => ({
    url: 'core/v4/nps/dismiss',
    method: 'post',
});

export const submitNps = (data: SubmitNpsRequest) => ({
    url: 'core/v4/nps/submit',
    method: 'post',
    data,
});
