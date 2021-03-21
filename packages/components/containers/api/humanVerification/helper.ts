import { queryVerificationCode } from 'proton-shared/lib/api/user';
import { VerificationModel } from './interface';

export const getFormattedCode = (value: string, code: string) => {
    return `${value}:${code}`.replace(/\s/g, '');
};

export const getRoute = (verificationModel: VerificationModel) => {
    if (verificationModel.method === 'email') {
        return queryVerificationCode('email', { Address: verificationModel.value });
    }
    return queryVerificationCode('sms', { Phone: verificationModel.value });
};
