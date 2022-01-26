import { queryVerificationCode } from '@proton/shared/lib/api/user';
import { HumanVerificationMethodType } from '@proton/shared/lib/interfaces';
import { VerificationModel } from './interface';

export const getFormattedCode = (verificationModel: VerificationModel, code: string) => {
    if (verificationModel.method === 'ownership-email' || verificationModel.method === 'ownership-sms') {
        return code;
    }
    return `${verificationModel.value}:${code}`.replace(/\s/g, '');
};

export const getRoute = (verificationModel: VerificationModel) => {
    if (verificationModel.method === 'email') {
        return queryVerificationCode('email', { Address: verificationModel.value });
    }
    if (verificationModel.method === 'sms') {
        return queryVerificationCode('sms', { Phone: verificationModel.value });
    }
    throw new Error('Unsupported route');
};

export const getAvailableMethods = (methods: HumanVerificationMethodType[]) => {
    const map = methods.reduce<{ [key in HumanVerificationMethodType]?: boolean }>((acc, method) => {
        acc[method] = true;
        return acc;
    }, {});
    return {
        captcha: !!map.captcha,
        email: !!map.email,
        sms: !!map.sms,
        'ownership-email': !!map['ownership-email'],
        'ownership-sms': !!map['ownership-sms'],
        invite: !!map.invite,
    } as const;
};
