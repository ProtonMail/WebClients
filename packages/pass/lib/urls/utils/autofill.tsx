import { c } from 'ttag';

import uniqueBy from '@proton/utils/uniqueBy';

import type { ItemRevision, UrlItem } from '../../../types';
import { AutofillMode } from '../../../types/protobuf';
import type { AutofillUrl } from '../../../types/protobuf/item-v1';
import { deduplicate } from '../../../utils/array/duplicate';
import { partition } from '../../../utils/array/partition';
import { isEmptyString } from '../../../utils/string/is-empty-string';
import { uniqueId } from '../../../utils/string/unique-id';
import { ItemUrlMatch, getItemPriorityForUrl } from '../search/match-url';
import { parseUrl } from './parser';

/** List of modes where the url field is an actual url and can be used as such */
export const autofillWithUrls = [
    AutofillMode.Default,
    AutofillMode.Exact,
    AutofillMode.Never,
    AutofillMode.ExactPath,
    AutofillMode.StartWith,
];

/** Test if the mode use an url field with an actual url */
export const isAutofillModeDataOfTypeUrl = (mode: AutofillMode) => autofillWithUrls.includes(mode);

/** Test if the mode represents an actual autofill target: a url-type mode that
 * isn't `Never`, which is a block rule rather than a fillable site */
export const isAutofillTargetMode = (mode: AutofillMode) =>
    isAutofillModeDataOfTypeUrl(mode) && mode !== AutofillMode.Never;

/** Get all autofill urls that are of url type, they can be of different mode
 * including never, we only ensure that they are of type url */
export const getAutofillUrls = (autofillUrls: AutofillUrl[]) =>
    autofillUrls.filter(({ mode }) => isAutofillModeDataOfTypeUrl(mode)).map(({ url }) => url);

/** Get urls restricted to `Default` mode: the retro-compat set surfaced to old clients /
 * importers that only understand the legacy flat `urls` field. Surfacing any other mode
 * there would make an old client autofill more broadly than the mode intends. */
export const getDefaultModeUrls = (autofillUrls: AutofillUrl[]) =>
    autofillUrls.filter(({ mode }) => mode === AutofillMode.Default).map(({ url }) => url);

export const getModeLabel = (mode: AutofillMode) => {
    switch (mode) {
        case AutofillMode.Default:
            return c('Label').t`Parent domain and subdomains (default)`;
        case AutofillMode.Exact:
            return c('Label').t`Exact host matching`;
        case AutofillMode.Never:
            return c('Label').t`Never fill on this exact URL`;
        case AutofillMode.StartWith:
            return c('Label').t`Starts with`;
        case AutofillMode.Pattern:
            return c('Label').t`URL wildcard pattern`;
        case AutofillMode.RegularExpression:
            return c('Label').t`Regular expression`;
        case AutofillMode.ExactPath:
            return c('Label').t`Exact URL matching`;
    }
};

export const getModeDescription = (mode: AutofillMode) => {
    switch (mode) {
        case AutofillMode.Exact:
            return c('Message').t`Exact (sub) domain matching rule`;
        case AutofillMode.Never:
            return c('Message').t`Never fill with this exact URL`;
        case AutofillMode.StartWith:
            return c('Message').t`'Starts with' matching rule`;
        case AutofillMode.Pattern:
            return c('Message').t`Wildcard pattern matching rule`;
        case AutofillMode.RegularExpression:
            return c('Message').t`Regular expression rule`;
        case AutofillMode.ExactPath:
            return c('Message').t`Exact URL matching rule`;
    }
};

const modeWithWarnings = [AutofillMode.StartWith, AutofillMode.RegularExpression];

export const getModeWarning = (mode: AutofillMode) => {
    if (!modeWithWarnings.includes(mode)) return;
    const modeLabelStong = <strong key="modeLabelStong">{getModeLabel(mode)}</strong>;
    // translator: modeLabelStong is the name of the autofill mode, namely "Starts with" or "Regular expression" with bold font
    return c('Warning')
        .jt`${modeLabelStong} provides powerful control, but a single error can cause autofill to match and fill data on fraudulent or phishing websites.`;
};

/** Keeps the stored `url` as-is even when it now fails `sanitizeURL`: this hydrates the
 * edit form from already-persisted data (import, older client, mobile), so blanking an
 * invalid value here would silently wipe it out the next time the form is saved. */
export const createNewUrlItem = ({ url, mode }: AutofillUrl): UrlItem => ({
    id: uniqueId(),
    url,
    mode,
});

export const sortDefaultFirst = (urls: AutofillUrl[]) => {
    const [defaults, nonDefaults] = partition(urls, ({ mode }) => mode === AutofillMode.Default);
    return [...defaults, ...nonDefaults];
};

export const fromItems = (urls: UrlItem[], url: string): AutofillUrl[] => {
    let autofillUrls = urls.map(({ url, mode }) => ({ url, mode }));
    if (!isEmptyString(url)) autofillUrls = [...autofillUrls, { url, mode: AutofillMode.Default }];
    autofillUrls = deduplicate(
        autofillUrls,
        ({ url: urlA, mode: modeA }) =>
            ({ url: urlB, mode: modeB }) =>
                urlA === urlB && modeA === modeB
    );
    return sortDefaultFirst(autofillUrls);
};

/** Return url in default mode first, other valid url if there are none */
export const getFirstUrl = (urls: AutofillUrl[] = []) => {
    const defaultUrl = urls.find(({ mode }) => mode === AutofillMode.Default);
    if (defaultUrl) return defaultUrl.url;

    const anyUrl = urls.find(({ mode }) => isAutofillTargetMode(mode));
    if (anyUrl) return anyUrl.url;

    return null;
};

export const testUrl = (url: string, autofillUrl: AutofillUrl, regexEnabled: boolean) => {
    const item = {
        itemId: 'itemId',
        data: { type: 'login', content: { autofillUrls: [autofillUrl] } },
    } as ItemRevision<'login'>;
    const result = getItemPriorityForUrl(parseUrl(url), item, { strict: false, regexEnabled });
    return result !== ItemUrlMatch.NO_MATCH;
};

export const autofillKey = (url: AutofillUrl) => `${url.mode}${url.url}`;

export const uniqueAutofillUrls = (urls: AutofillUrl[]) => uniqueBy(urls, autofillKey);
