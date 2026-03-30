import type { TtagLocaleMap } from '../interfaces/Locale';
import { getProtonConfig } from '../interfaces/config';

export let locales: TtagLocaleMap = {};

export const setTtagLocales = (newLocales: TtagLocaleMap) => {
    locales = newLocales;
};

/** The loader must be defined at the application call site (not inlined here) because bundlers
 * (webpack, vite) resolve dynamic import paths statically at build time. The path prefix in
 * `import(\`../../locales/${locale}.json\`)` must be relative to the application source so the
 * bundler can discover the correct locale files and emit the right chunks. */
export const createLocaleMap = (loader: (locale: string) => Promise<any>): TtagLocaleMap =>
    Object.fromEntries(
        Object.keys(getProtonConfig().LOCALES).map((locale) => [
            locale,
            () => loader(locale).then((m) => m.default ?? m),
        ])
    );
