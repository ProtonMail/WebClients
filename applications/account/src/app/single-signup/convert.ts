import { getIsConvertHostname } from '@proton/shared/lib/helpers/url';

export const pushConvertGoal = (value: string[]) => {
    if (!getIsConvertHostname(location.hostname)) {
        return;
    }
    // @ts-ignore
    window._conv_q = window._conv_q || [];
    // @ts-ignore
    window._conv_q.push(value);
};
