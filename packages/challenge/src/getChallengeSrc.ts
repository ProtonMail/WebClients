export const CHALLENGE_PATHNAME = '/challenge/v5/html';

export interface ChallengeSrcOptions {
    type: number;
    name: string;
    /** Kept for parity with v4. The frame renders nothing, but the API logs it. */
    lang?: string;
    dir?: 'ltr' | 'rtl';
    retry?: number;
}

/** Caller resolves the API URL; this adds the challenge parameters. */
export const getChallengeSrc = (url: string | URL, { type, name, lang, dir, retry }: ChallengeSrcOptions) => {
    const result = new URL(url.toString());
    result.searchParams.set('Type', `${type}`);
    result.searchParams.set('Name', name);
    if (lang) {
        result.searchParams.set('Lang', lang);
    }
    if (dir) {
        result.searchParams.set('Dir', dir);
    }
    if (retry) {
        result.searchParams.set('Retry', `${retry}`);
    }
    return result.toString();
};
