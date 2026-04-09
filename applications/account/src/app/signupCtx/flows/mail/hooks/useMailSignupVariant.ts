import { useLocation } from 'react-router-dom';

export const MAIL_SIGNUP_VARIANTS = {
    A: 'a',
    B: 'b',
    C: 'c',
} as const;

export type MailSignupVariant = (typeof MAIL_SIGNUP_VARIANTS)[keyof typeof MAIL_SIGNUP_VARIANTS];

const useMailSignupVariant = (): MailSignupVariant => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const v = searchParams.get('v');
    if (v === MAIL_SIGNUP_VARIANTS.B || v === MAIL_SIGNUP_VARIANTS.C) {
        return v;
    }
    return MAIL_SIGNUP_VARIANTS.A;
};

export default useMailSignupVariant;
