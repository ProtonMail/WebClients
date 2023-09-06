import fs from 'fs';
import { LocaleData, addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';
import { Configuration } from 'webpack';

import { Parameters } from './src/pages/interface';
import { getLangAttribute, getLocaleMap } from './src/static/localeMapping';

const pageExtensionRegex = /\.ts/;

const getPathnameFromFilename = (filename: string) => {
    return (
        filename
            // Special case, drop .login from the filename
            .replace('.login', '')
            // Drop json from the path
            .replace(pageExtensionRegex, '')
            // We replace . with / to pretend mail.signup -> mail/signup
            .replace('.', '/')
    );
};

const getRewrite = (file: string, pathname: string) => {
    const filename = file
        // Special case, drop .login from the filename
        .replace('.login', '')
        .replace(pageExtensionRegex, '.html')
        // @ts-ignore
        .replaceAll(/\.(?=.*\.)/g, '/')
        .replace('.html', '/index.html');

    return { filename, rewrite: { from: new RegExp(`^${pathname.replace('/', '/')}$`), to: `/${filename}` } };
};

const getShortLocalizedPathname = (shortLocale: string) => {
    return shortLocale === 'en' ? '' : `/${shortLocale}`;
};

export const localize = (localeCode: string, data: LocaleData | null) => {
    if (localeCode !== 'en_US' && data) {
        ttagAddLocale(localeCode, data);
    }
    ttagUseLocale(localeCode);
};

export interface HrefLang {
    hreflang: string;
    pathname: string;
}

interface Locale {
    pagePath: string;
    parameters: Parameters;
    pathname: string;
    localeData: LocaleData | null;
    shortLocale: string;
    originalLocale: string;
}

interface LocalizedPage {
    shortLocalizedPathname: string;
    filename: string;
    rewrite: { from: RegExp; to: string };
    parameters: Parameters & { pathname: string; lang: string };
}

const getLocalisedPage = ({
    pagePath,
    parameters,
    pathname,
    localeData,
    originalLocale,
    shortLocale,
}: Locale): LocalizedPage => {
    localize(originalLocale, localeData);
    const shortLocalizedPathname = getShortLocalizedPathname(shortLocale);
    const localisedPathname = `${shortLocalizedPathname}/${pathname}`;
    const localisedPagePath = shortLocale === 'en' ? pagePath : `${shortLocale}/${pagePath}`;

    const { filename, rewrite } = getRewrite(localisedPagePath, localisedPathname);
    return {
        shortLocalizedPathname,
        filename,
        rewrite,
        parameters: { pathname: localisedPathname, lang: getLangAttribute(originalLocale), ...parameters },
    };
};

export const getPages = (mode: Configuration['mode'], req: (path: string) => any) => {
    if (mode !== 'production') {
        return {
            pages: [],
            hreflangs: [],
        };
    }
    const pagePaths: string[] = fs.readdirSync('./src/pages').filter((pagePath: string) => {
        return pagePath.endsWith('.ts') && pagePath !== 'interface.ts';
    });

    // Reverse the pages so that /mail/signup is before /mail
    pagePaths.reverse();

    const localeFiles: string[] = fs.readdirSync('./locales');
    const localeMap = getLocaleMap(localeFiles);

    const localeExt = '.json';

    const locales = localeFiles
        .filter((localePath) => {
            return !localePath.includes('en_US') && localePath.endsWith(localeExt);
        })
        .map((localePath: string) => {
            const originalLocale = localePath.replace(localeExt, '');
            const shortLocale = localeMap[originalLocale];
            return {
                localeData: req(`./locales/${localePath}`),
                originalLocale,
                shortLocale,
            };
        });

    const hreflangs: HrefLang[] = [
        { hreflang: 'en-US', pathname: '' },
        ...locales.map(({ originalLocale, shortLocale }) => {
            const localisedPathname = getShortLocalizedPathname(shortLocale);
            return {
                // Special case for latin american region
                hreflang: getLangAttribute(originalLocale),
                pathname: localisedPathname,
            };
        }),
    ];

    const pages = pagePaths.flatMap((pagePath) => {
        const enFile = `./src/pages/${pagePath}`;
        const file = req(enFile);
        const parameters: Parameters = file.default;
        const pathname = getPathnameFromFilename(pagePath);

        return [
            getLocalisedPage({
                pathname,
                pagePath,
                parameters,
                originalLocale: 'en_US',
                localeData: null,
                shortLocale: 'en',
            }),
            ...locales.map((locale) =>
                getLocalisedPage({
                    pathname,
                    pagePath,
                    parameters,
                    ...locale,
                })
            ),
        ];
    });

    return {
        pages,
        hreflangs,
    };
};
