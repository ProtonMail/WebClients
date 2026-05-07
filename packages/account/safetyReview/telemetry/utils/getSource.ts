import { APPS } from '@proton/shared/lib/constants';

export type SafetyReviewSource =
    | 'email_danger'
    | 'email_warning'
    | 'email_info'
    | 'user_dropdown'
    | `user_dropdown_${string}`
    | `recovery_settings_${string}`
    | 'recovery_settings';

const appsValues = new Set<string>(Object.values(APPS));

const parseApp = (appnameParam: string): string | undefined => {
    if (appnameParam && appsValues.has(appnameParam)) {
        return appnameParam;
    }
    return undefined;
};

const normaliseAppName = (appnameParam: string | null): string | undefined => {
    if (!appnameParam) {
        return undefined;
    }

    const validApp = parseApp(appnameParam);
    if (!validApp) {
        return undefined;
    }
    return appnameParam.replace(/^proton-/, '').replace(/-/g, '_');
};

export const getSource = ({
    pathname,
    search,
}: {
    pathname: string;
    search: URLSearchParams;
}): SafetyReviewSource | undefined => {
    if (pathname.includes('safety-review/source/email-danger')) {
        return 'email_danger';
    }
    if (pathname.includes('safety-review/source/email-warning')) {
        return 'email_warning';
    }
    if (pathname.includes('safety-review/source/email-info')) {
        return 'email_info';
    }

    const sourceParam = search.get('source');
    const appnameParam = search.get('appname');

    const normalisedAppName = normaliseAppName(appnameParam);

    if (sourceParam === 'user_dropdown') {
        if (normalisedAppName) {
            return `user_dropdown_${normalisedAppName}`;
        }

        return 'user_dropdown';
    }

    if (sourceParam === 'recovery_settings') {
        if (normalisedAppName) {
            return `recovery_settings_${normalisedAppName}`;
        }

        return 'recovery_settings';
    }

    return undefined;
};
