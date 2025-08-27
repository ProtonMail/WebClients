import type { Parameters } from '../src/pages/interface';

export interface HrefLang {
    hreflang: string;
    pathname: string;
}

export interface LocalizedPage {
    shortLocalizedPathname: string;
    filename: string;
    rewrite: { from: RegExp; to: string };
    parameters: Parameters & { pathname: string; lang: string };
}
