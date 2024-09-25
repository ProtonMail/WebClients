import { getScopeFromProvider } from '../components/Modals/OAuth/StepProducts/useStepProducts.helpers';
import { ImportProvider, ImportType, OAUTH_PROVIDER } from '../interface';
import { getOAuthAuthorizationUrl, getOAuthRedirectURL, getProviderNumber } from './useOAuthPopup.helpers';

describe('OAuth url generation', () => {
    it('Should throw an error when unsupported provider (getProviderNumber)', () => {
        expect(() => getProviderNumber(ImportProvider.DEFAULT)).toThrowError('Provider does not exist');
    });

    it('Should throw an error when unsupported provider (getOAuthRedirectURL)', () => {
        expect(() => getOAuthRedirectURL(ImportProvider.DEFAULT)).toThrowError('Provider does not exist');
    });

    it('Should throw an error when unsupported provider (getOAuthAuthorizationUrl)', () => {
        const config = {
            'importer.google.client_id': 'string',
            'importer.outlook.client_id': 'string',
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

    it('Should return appropriate Outlook OAuth URL', () => {
        const provider = ImportProvider.OUTLOOK;
        const scopesMail = getScopeFromProvider(provider, [ImportType.MAIL]);
        const config = {
            'importer.google.client_id': 'string',
            'importer.outlook.client_id': 'string',
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
            loginHint: 'login hint',
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

    it('Should return appropriate Google OAuth URL', () => {
        const provider = ImportProvider.GOOGLE;
        const scopesMail = getScopeFromProvider(provider, [ImportType.MAIL]);
        const config = {
            'importer.google.client_id': 'string',
            'importer.outlook.client_id': 'string',
        };

        const googleMailsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesMail.join(' '),
            config,
            consentExperiment: false,
        });
        expect(googleMailsRedirect).toStrictEqual(
            'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly&prompt=consent&access_type=offline&client_id=string'
        );

        const scopesContact = getScopeFromProvider(provider, [ImportType.CONTACTS]);
        const googleContactsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesContact.join(' '),
            config,
            consentExperiment: false,
        });
        expect(googleContactsRedirect).toStrictEqual(
            'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontacts.readonly&prompt=consent&access_type=offline&client_id=string'
        );

        const googleHintRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesContact.join(' '),
            config,
            loginHint: 'login hint',
            consentExperiment: false,
        });
        expect(googleHintRedirect).toStrictEqual(
            'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontacts.readonly&prompt=consent&access_type=offline&client_id=string&login_hint=login+hint'
        );

        const scopesCalendars = getScopeFromProvider(provider, [ImportType.CALENDAR]);
        const googleCalendarsRedirect = getOAuthAuthorizationUrl({
            provider,
            scope: scopesCalendars.join(' '),
            config,
            consentExperiment: false,
        });
        expect(googleCalendarsRedirect).toStrictEqual(
            'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly&prompt=consent&access_type=offline&client_id=string'
        );

        const scopesAll = getScopeFromProvider(provider, [ImportType.CALENDAR, ImportType.CONTACTS, ImportType.MAIL]);
        const googleAllScopes = getOAuthAuthorizationUrl({
            provider,
            scope: scopesAll.join(' '),
            config,
            consentExperiment: false,
        });
        expect(googleAllScopes).toStrictEqual(
            'https://accounts.google.com/o/oauth2/v2/auth?redirect_uri=https%3A%2F%2Fwww.protontesting.com%2Foauth%2Fcallback&response_type=code&scope=email+openid+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar.readonly+https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcontacts.readonly&prompt=consent&access_type=offline&client_id=string'
        );
    });
});
