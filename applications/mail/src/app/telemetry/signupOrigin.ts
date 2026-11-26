import { Product } from '@proton/shared/lib/ProductEnum';
import { getItem, setItem } from '@proton/shared/lib/helpers/sessionStorage';

/**
 * Proof of concept (DAWG-99): the Account app adds `welcome=true&signupProduct=Mail` to the URL it sends the user to when the account
 * was just created with the Mail signup flow (and only then). The Mail app reads it at startup and keeps it in the session
 * storage, which is dropped with the tab, so the onboarding can tell later that the user comes from the web signup.
 */
const WEB_SIGNUP_KEY = 'mail-web-signup';

/** Several searches: the parameter is on the URL the app is opened on, or on the one it is redirected to after the fork */
export const rememberWebSignup = (...searches: string[]) => {
    const isMailSignup = (search: string) => {
        const params = new URLSearchParams(search);
        return params.get('welcome') === 'true' && params.get('signupProduct') === Product.Mail;
    };
    if (searches.some(isMailSignup)) {
        setItem(WEB_SIGNUP_KEY, 'true');
    }
};

export const isFromWebSignup = () => getItem(WEB_SIGNUP_KEY) === 'true';
