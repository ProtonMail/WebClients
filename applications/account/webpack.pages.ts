import fs from 'fs';
import { LocaleData, addLocale as ttagAddLocale, useLocale as ttagUseLocale } from 'ttag';

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

export const localize = (localeCode: string, data: LocaleData) => {
    if (localeCode !== 'en_US' && data) {
        ttagAddLocale(localeCode, data);
    }
    ttagUseLocale(localeCode);
};

export const getPages = (filter: (locale: string) => boolean, req: (path: string) => any) => {
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
            return !localePath.includes('en_US') && localePath.endsWith(localeExt) && filter(localePath);
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

    const getShortLocalizedPathname = (shortLocale: string) => {
        return shortLocale === 'en' ? '' : `/${shortLocale}`;
    };

    const hreflangs = [
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
        const getParameters: () => Parameters = file.default;
        const pathname = getPathnameFromFilename(pagePath);

        const getLocalisedPage = ({
            localeData,
            originalLocale,
            shortLocale,
        }: Pick<(typeof locales)[0], 'localeData' | 'shortLocale' | 'originalLocale'>) => {
            localize(originalLocale, localeData);
            const parameters = getParameters();

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

        return [
            getLocalisedPage({
                originalLocale: 'en_US',
                localeData: null,
                shortLocale: 'en',
            }),
            ...locales.map(getLocalisedPage),
        ];
    });

    return {
        pages,
        hreflangs,
    };
};
