import { mockWindowLocation, resetWindowLocation } from '@proton/components/helpers/url.test.helpers';
import { GOOGLE_OAUTH_PATH } from '@proton/shared/lib/api/activation';

import { getScopeFromProvider } from '../components/Modals/OAuth/StepProducts/useStepProducts.helpers';
import { EASY_SWITCH_FEATURES, ImportProvider, ImportType, OAUTH_PROVIDER } from '../interface';
import {
    generateGoogleOAuthUrl,
    getEasySwitchFeaturesFromProducts,
    getOAuthAuthorizationUrl,
    getOAuthRedirectURL,
    getProviderNumber,
} from './useOAuthPopup.helpers';

const windowHostname = 'https://mail.proton.me';
const redirectUri = 'https://redirect-uri.com';

describe('OAuth url generation', () => {
    it('Should throw an error when unsupported provider (getProviderNumber)', () => {
        expect(() => getProviderNumber(ImportProvider.DEFAULT)).toThrowError('Provider does not exist');
    });

    it('Should throw an error when unsupported provider (getOAuthRedirectURL)', () => {
        expect(() => getOAuthRedirectURL(ImportProvider.DEFAULT)).toThrowError('Provider does not exist');
    });

    it('Should throw an error when unsupported provider (getOAuthAuthorizationUrl)', () => {
        const config = {
            'oauth.google.client_id': 'string',
            'oauth.outlook.client_id': 'string',
            'oauth.zoom.client_id': 'string',
        };

        expect(() =>
            getOAuthAuthorizationUrl({ provider: ImportProvider.DEFAULT, scope: '', config, consentExperiment: false })
        ).toThrowError('Provider does not exist');
    });

    it('Should return appropriate number for each supported providers', () => {
        const googleNumber = getProviderNumber(ImportProvider.GOOGLE);
        expect(googleNumber).toStrictEqual(OAUTH_PROVIDER.GOOGLE);

        const outlookNumber = getProviderNumber(ImportProvider.OUTLOOK);
        expect(outlookNumber).toStrictEqual(OAUTH_PROVIDER.OUTLOOK);

        const zoomNumber = getProviderNumber(OAUTH_PROVIDER.ZOOM);
        expect(zoomNumber).toStrictEqual(OAUTH_PROVIDER.ZOOM);
    });

    it('Should return appropriate Google redirect URL', () => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            value: new URL(window.location.href),
        });
        const expectedUrl = 'https://www.protontesting.com/mypath';
        window.location.href = expectedUrl;

        const redirectUrl = getOAuthRedirectURL(ImportProvider.GOOGLE);
        expect(redirectUrl).toStrictEqual('https://www.protontesting.com/oauth/callback');
    });

    it('Should return appropriate Outlook redirect URL', () => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            value: new URL(window.location.href),
        });
        const expectedUrl = 'https://www.protontesting.com/mypath';
        window.location.href = expectedUrl;

        const redirectUrl = getOAuthRedirectURL(ImportProvider.OUTLOOK);
        expect(redirectUrl).toStrictEqual('https://www.protontesting.com/oauth/callback');
    });

    it('Should return appropriate Zoom redirect URL', () => {
        Object.defineProperty(window, 'location', {
            configurable: true,
            enumerable: true,
            value: new URL(window.location.href),
        });
        const expectedUrl = 'https://www.protontesting.com/mypath';
        window.location.href = expectedUrl;

        const redirectUrl = getOAuthRedirectURL(OAUTH_PROVIDER.ZOOM);
        expect(redirectUrl).toStrictEqual('https://www.protontesting.com/oauth/callback');
    });

    it('Should return appropriate Outlook OAuth URL', () => {
        const provider = ImportProvider.OUTLOOK;
        const scopesMail = getScopeFromProvider(provider, [ImportType.MAIL]);
        const config = {
            'oauth.google.client_id': 'string',
            'oauth.outlook.client_id': 'string',
            'oauth.zoom.client_id': 'string',
        };

        const outlookMailsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesMail.join(' '),
            config,
            consentExperiment: false,
        });
        expect(outlookMailsRedirect).toStrictEqual(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+User.Read+offline_access+Mail.read&prompt=consent&client_id=string'
        );

        const scopesContact = getScopeFromProvider(provider, [ImportType.CONTACTS]);
        const outlookContactsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesContact.join(' '),
            config,
            consentExperiment: false,
        });
        expect(outlookContactsRedirect).toStrictEqual(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+User.Read+offline_access+Contacts.read&prompt=consent&client_id=string'
        );

        const outlookHintRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesContact.join(' '),
            config,
            consentExperiment: false,
        });
        expect(outlookHintRedirect).toStrictEqual(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+User.Read+offline_access+Contacts.read&prompt=consent&client_id=string'
        );

        const scopesCalendars = getScopeFromProvider(provider, [ImportType.CALENDAR]);
        const outlookCalendarsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesCalendars.join(' '),
            config,
            consentExperiment: false,
        });
        expect(outlookCalendarsRedirect).toStrictEqual(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+User.Read+offline_access+Calendars.read&prompt=consent&client_id=string'
        );

        const scopesAll = getScopeFromProvider(provider, [ImportType.CALENDAR, ImportType.CONTACTS, ImportType.MAIL]);
        const outlookAllScopes = getOAuthAuthorizationUrl({
            provider,
            scope: scopesAll.join(' '),
            config,
            consentExperiment: false,
        });
        expect(outlookAllScopes).toStrictEqual(
            'https://login.microsoftonline.com/common/oauth2/v2.0/authorize?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+User.Read+offline_access+Mail.read+Calendars.read+Contacts.read&prompt=consent&client_id=string'
        );
    });

    describe('generateGoogleOAuthUrl', () => {
        beforeEach(() => {
            mockWindowLocation(windowHostname);
        });

        afterEach(() => {
            resetWindowLocation();
        });

        it('Should return appropriate Google OAuth URL', () => {
            const googleMailsAuthorizationURL = generateGoogleOAuthUrl({
                features: [EASY_SWITCH_FEATURES.IMPORT_MAIL],
                redirectUri,
            });
            expect(googleMailsAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_MAIL}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );

            const googleContactsAuthorizationURL = generateGoogleOAuthUrl({
                features: [EASY_SWITCH_FEATURES.IMPORT_CONTACTS],
                redirectUri,
            });
            expect(googleContactsAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_CONTACTS}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );

            const loginHint = 'login hint';
            const googleHintAuthorizationURL = generateGoogleOAuthUrl({
                features: [EASY_SWITCH_FEATURES.IMPORT_CONTACTS],
                redirectUri,
                loginHint,
            });
            expect(googleHintAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_CONTACTS}&redirect_uri=${encodeURIComponent(redirectUri)}&loginHint=login+hint`
            );

            const googleCalendarsAuthorizationURL = generateGoogleOAuthUrl({
                features: [EASY_SWITCH_FEATURES.IMPORT_CALENDAR],
                redirectUri,
            });
            expect(googleCalendarsAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_CALENDAR}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );

            const googleAllScopesAuthorizationURL = generateGoogleOAuthUrl({
                features: [
                    EASY_SWITCH_FEATURES.IMPORT_MAIL,
                    EASY_SWITCH_FEATURES.IMPORT_CALENDAR,
                    EASY_SWITCH_FEATURES.IMPORT_CONTACTS,
                ],
                redirectUri,
            });
            expect(googleAllScopesAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_MAIL}&proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_CALENDAR}&proton_feature%5B%5D=${EASY_SWITCH_FEATURES.IMPORT_CONTACTS}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );

            const BYOESAuthorizationURL = generateGoogleOAuthUrl({
                features: [EASY_SWITCH_FEATURES.BYOE],
                redirectUri,
            });
            expect(BYOESAuthorizationURL).toStrictEqual(
                `https://mail.proton.me${GOOGLE_OAUTH_PATH}?proton_feature%5B%5D=${EASY_SWITCH_FEATURES.BYOE}&redirect_uri=${encodeURIComponent(redirectUri)}`
            );
        });
    });

    describe('getEasySwitchFeaturesFromProducts', () => {
        it('should return the expected features from import import types', () => {
            const productsMail = [ImportType.MAIL];
            const productsCalendar = [ImportType.CALENDAR];
            const productsContacts = [ImportType.CONTACTS];
            const productsAll = [...productsMail, ...productsCalendar, ...productsContacts];

            expect(getEasySwitchFeaturesFromProducts(productsMail)).toEqual([EASY_SWITCH_FEATURES.IMPORT_MAIL]);
            expect(getEasySwitchFeaturesFromProducts(productsCalendar)).toEqual([EASY_SWITCH_FEATURES.IMPORT_CALENDAR]);
            expect(getEasySwitchFeaturesFromProducts(productsContacts)).toEqual([EASY_SWITCH_FEATURES.IMPORT_CONTACTS]);
            expect(getEasySwitchFeaturesFromProducts(productsAll)).toEqual([
                EASY_SWITCH_FEATURES.IMPORT_MAIL,
                EASY_SWITCH_FEATURES.IMPORT_CALENDAR,
                EASY_SWITCH_FEATURES.IMPORT_CONTACTS,
            ]);
        });
    });
});
