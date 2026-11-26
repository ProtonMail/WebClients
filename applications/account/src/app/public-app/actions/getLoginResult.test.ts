import { Product } from '@proton/shared/lib/ProductEnum';
import { APPS } from '@proton/shared/lib/constants';
import type { Api } from '@proton/shared/lib/interfaces/Api';

import type { AppIntent, AuthSession } from '../authSession';
import { getPaths } from '../helper';
import { getLoginResult } from './getLoginResult';

const api = vi.fn() as unknown as Api;

const getSignupUrl = async ({
    appIntent,
    preAppIntent,
}: {
    appIntent?: AppIntent;
    preAppIntent?: typeof APPS.PROTONMAIL;
}) => {
    const initialSearchParams = new URLSearchParams();
    const session = {
        flow: 'signup',
        appIntent,
        data: { localID: 1, User: { Flags: {} }, persistedSession: {} },
    } as unknown as AuthSession;

    const result = await getLoginResult({
        api,
        session,
        initialSearchParams,
        preAppIntent,
        paths: getPaths({
            maybeLocalePrefix: '',
            forkState: undefined,
            app: undefined,
            productParam: undefined,
            searchParams: initialSearchParams,
        }),
    });

    if (result.type !== 'done' || !result.payload.url) {
        throw new Error('Expected a done result with an url');
    }
    return new URL(result.payload.url.toString());
};

describe('getLoginResult signup redirect', () => {
    it('tells that the signup is a mail signup when the app comes from the app intent', async () => {
        const url = await getSignupUrl({ appIntent: { app: APPS.PROTONMAIL } });

        expect(url.searchParams.get('welcome')).toBe('true');
        expect(url.searchParams.get('signupProduct')).toBe(Product.Mail);
    });

    it('tells that the signup is a mail signup when the app comes from the page', async () => {
        const url = await getSignupUrl({ preAppIntent: APPS.PROTONMAIL });

        expect(url.searchParams.get('signupProduct')).toBe(Product.Mail);
    });

    it('does not tell the app when it was picked in the app switcher after the signup', async () => {
        const url = await getSignupUrl({
            appIntent: { app: APPS.PROTONMAIL, ref: 'product-switch' },
        });

        expect(url.searchParams.get('welcome')).toBe('true');
        expect(url.searchParams.get('ref')).toBe('product-switch');
        expect(url.searchParams.has('signupProduct')).toBe(false);
    });

    it('tells the app of the other products', async () => {
        const url = await getSignupUrl({ appIntent: { app: APPS.PROTONPASS } });

        expect(url.searchParams.get('signupProduct')).toBe(Product.Pass);
    });
});
