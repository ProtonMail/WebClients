import { normalize } from '@proton/shared/lib/helpers/string';

import type {
    DeobfuscatedItemExtraField,
    ExtraFieldType,
    ItemContent,
    ItemExtraField,
    ItemRevision,
    ItemType,
} from '../../types';
import { dynMemo } from '../../utils/fp/memo';
import { deobfuscate } from '../../utils/obfuscate/xor';
import type { FieldMatch, ItemMatch, ItemMatchMap } from './types';

/** We used to match on hidden fields but switched over to only text types */
const isFieldTypeSearchable = <F extends { type: ExtraFieldType }>(field: F): field is Extract<F, { type: 'text' }> =>
    field.type === 'text';

const memoNormalize = dynMemo((str: string) => normalize(str, true));
const memoDeobfuscate = dynMemo(deobfuscate);

/** Field weights encode which field a match came from. They are the primary
 * relevance signal, combined multiplicatively with match quality
 * (`weight * quality`), so the matched field generally matters more than how the
 * needle landed - but the two are balanced, not absolute.
 *
 * TITLE sits a full order of magnitude above the rest - more than the largest
 * quality multiplier (`EXACT = 8`) - so a title match *always* outranks any
 * field match, whatever its quality. This is what fixes "search protonmail
 * returns every account that uses a protonmail address before the account
 * actually named Protonmail".
 *
 * The remaining tiers are spaced closer together on purpose, so a strong-quality
 * match on a lower-weight field can overtake a weak match on a higher-weight one:
 * e.g. an exact URL match (`50 * 8 = 400`) beats a mere email substring
 * (`100 * 1 = 100`), and an exact note (`10 * 8 = 80`) beats a URL substring
 * (`50 * 1 = 50`). Field weight leads; match quality balances. */
enum FieldWeight {
    /** Item title / name */
    TITLE = 1000,
    /** Identifying fields a user is most likely to search by (login email,
     * username, alias address, cardholder name) */
    PRIMARY = 100,
    /** Login URLs */
    URL = 50,
    /** Everything else (notes, content fields, extra fields, sections) */
    SECONDARY = 10,
}

/** Match quality boosts a match within a field based on where/how the needle
 * lands. A whole-field match beats a match at a word boundary, which beats a
 * match in the middle of a word. */
enum MatchQuality {
    NONE = 0,
    SUBSTRING = 1,
    WORD_PREFIX = 2,
    PREFIX = 4,
    EXACT = 8,
}

const isWordBoundary = (char: string): boolean => /[\s\-_./@:,]/.test(char);

/** Scores how well `needle` matches the already normalized `haystack`.
 * Returns `MatchQuality.NONE` (`0`) when there is no match. */
const matchQuality = (needle: string, haystack: string): MatchQuality => {
    if (needle.length === 0) return MatchQuality.NONE;

    let index = haystack.indexOf(needle);
    if (index === -1) return MatchQuality.NONE;

    if (haystack.length === needle.length) return MatchQuality.EXACT;
    if (index === 0) return MatchQuality.PREFIX;

    /* the first occurrence is mid-string, so the best quality still reachable is
     * WORD_PREFIX: scan the remaining occurrences for one at a word boundary
     * (e.g. "art" lands at a word boundary in "smart art" but only mid-word in
     * "cartographer") */
    while (index !== -1) {
        if (isWordBoundary(haystack[index - 1])) return MatchQuality.WORD_PREFIX;
        index = haystack.indexOf(needle, index + 1);
    }

    return MatchQuality.SUBSTRING;
};

/** Scores a single field obtained through a getter against a needle.
 * The resulting score is `weight * quality`, enabling lazy evaluation
 * when combined in `combineMatchers`. */
const matchField =
    <T extends ItemType>(weight: FieldWeight, getter: (item: ItemRevision<T>) => string): FieldMatch<T> =>
    (item) =>
    (needle) =>
        weight * matchQuality(needle, memoNormalize(getter(item)));

/** Scores any field from an array returned by the getter, keeping the best. */
const matchFields =
    <T extends ItemType>(weight: FieldWeight, getter: (item: ItemRevision<T>) => string[]): FieldMatch<T> =>
    (item) =>
    (needle) => {
        let best = MatchQuality.NONE as number;
        for (const field of getter(item)) {
            best = Math.max(best, matchQuality(needle, memoNormalize(field)));
            if (best === MatchQuality.EXACT) break;
        }
        return weight * best;
    };

/** Scores fields from an `IterableIterator` returned by the getter, keeping the
 * best. Iteration stops early on a perfect (exact) match. */
const matchFieldsLazy =
    <T extends ItemType>(
        weight: FieldWeight,
        getter: (item: ItemRevision<T>) => IterableIterator<string>
    ): FieldMatch<T> =>
    (item) =>
    (needle) => {
        let best = MatchQuality.NONE as number;
        for (const field of getter(item)) {
            best = Math.max(best, matchQuality(needle, memoNormalize(field)));
            if (best === MatchQuality.EXACT) break;
        }
        return weight * best;
    };

/** Scores all fields which are of type string in the item content */
const matchContentFields = <T extends ItemType>(
    weight: FieldWeight,
    getter: (item: ItemRevision<T>) => ItemContent<T>
): FieldMatch<T> =>
    matchFieldsLazy(weight, function* (item): IterableIterator<string> {
        const content = getter(item);
        for (const key of Object.keys(content) as (keyof ItemContent<T>)[]) {
            const value = content[key];
            if (typeof value === 'string') yield value;
        }
    });

type ExtraFieldsSources = {
    obfuscated?: ItemExtraField[];
    deobfuscated?: DeobfuscatedItemExtraField[][];
    sections?: { sectionName: string; sectionFields: DeobfuscatedItemExtraField[] }[];
};

/** Scores all kinds of extra fields */
const matchExtraFields = <T extends ItemType>(
    weight: FieldWeight,
    getter: (item: ItemRevision<T>) => ExtraFieldsSources
): FieldMatch<T> =>
    matchFieldsLazy(weight, function* (item): IterableIterator<string> {
        const { obfuscated = [], deobfuscated = [], sections = [] } = getter(item);

        // Extra fields that each content is obfuscated
        for (const field of obfuscated) {
            yield field.fieldName;
            if (isFieldTypeSearchable(field)) yield memoDeobfuscate(field.data.content);
        }

        // Group of extra fields that are already deobfuscated
        for (const group of deobfuscated) {
            if (group === undefined) continue;
            for (const field of group) {
                yield field.fieldName;
                if (isFieldTypeSearchable(field)) yield field.data.content;
            }
        }

        // Sections of extra fields
        for (const section of sections) {
            yield section.sectionName;
            for (const field of section.sectionFields) {
                yield field.fieldName;
                if (isFieldTypeSearchable(field)) yield field.data.content;
            }
        }
    });

/** Combines multiple field matchers into a relevance score for the item.
 * An item matches only if *every* needle matches at least one field (the
 * previous boolean AND-of-needles / OR-of-fields semantics is preserved: a
 * score of `0` means "not a match"). When all needles match, the item score is
 * the sum, over needles, of the best field score for that needle - so a needle
 * landing on the title contributes far more than one landing on a note.
 *
 * Normalization and deobfuscation are memoized only for multiple needles since
 * a single needle has no field reuse across iterations. Cache is cleared per
 * item to avoid memory leaks. */
const combineMatchers =
    <T extends ItemType>(...matchers: FieldMatch<T>[]): ItemMatch<T> =>
    (item) =>
    (needles) => {
        const shouldMemo = needles.length > 1;

        memoNormalize.memo = shouldMemo;
        memoDeobfuscate.memo = shouldMemo;

        let total = 0;

        for (const needle of needles) {
            let best = 0;
            for (const matcher of matchers) best = Math.max(best, matcher(item)(needle));
            /* a single unmatched needle disqualifies the whole item */
            if (best === 0) {
                total = 0;
                break;
            }
            total += best;
        }

        if (shouldMemo) {
            memoNormalize.clear();
            memoDeobfuscate.clear();
        }

        return total;
    };

const matchesNoteItem: ItemMatch<'note'> = combineMatchers<'note'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchField(FieldWeight.SECONDARY, (item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesLoginItem: ItemMatch<'login'> = combineMatchers<'login'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchField(FieldWeight.PRIMARY, (item) => memoDeobfuscate(item.data.content.itemEmail)),
    matchField(FieldWeight.PRIMARY, (item) => memoDeobfuscate(item.data.content.itemUsername)),
    matchField(FieldWeight.SECONDARY, (item) => memoDeobfuscate(item.data.metadata.note)),
    matchFields(FieldWeight.URL, (item) => item.data.content.autofillUrls.map(({ url }) => url)),
    matchExtraFields(FieldWeight.SECONDARY, (item) => ({ obfuscated: item.data.extraFields }))
);

const matchesAliasItem: ItemMatch<'alias'> = combineMatchers<'alias'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchField(FieldWeight.PRIMARY, (item) => item.aliasEmail ?? ''),
    matchField(FieldWeight.SECONDARY, (item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesCreditCardItem: ItemMatch<'creditCard'> = combineMatchers<'creditCard'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchField(FieldWeight.PRIMARY, (item) => item.data.content.cardholderName),
    matchField(FieldWeight.SECONDARY, (item) => memoDeobfuscate(item.data.metadata.note))
);

const matchesIdentityItem: ItemMatch<'identity'> = combineMatchers<'identity'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchField(FieldWeight.SECONDARY, (item) => memoDeobfuscate(item.data.metadata.note)),
    matchContentFields(FieldWeight.SECONDARY, (item) => item.data.content),
    matchExtraFields(FieldWeight.SECONDARY, (item) => ({
        obfuscated: item.data.extraFields,
        deobfuscated: [
            item.data.content.extraPersonalDetails,
            item.data.content.extraAddressDetails,
            item.data.content.extraContactDetails,
            item.data.content.extraWorkDetails,
        ],
        sections: item.data.content?.extraSections,
    }))
);

const matchesSSHItem: ItemMatch<'sshKey'> = combineMatchers<'sshKey'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchExtraFields(FieldWeight.SECONDARY, (item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

const matchesWifiItem: ItemMatch<'wifi'> = combineMatchers<'wifi'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchExtraFields(FieldWeight.SECONDARY, (item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

const matchesCustomItem: ItemMatch<'custom'> = combineMatchers<'custom'>(
    matchField(FieldWeight.TITLE, (item) => item.data.metadata.name),
    matchExtraFields(FieldWeight.SECONDARY, (item) => ({
        obfuscated: item.data.extraFields,
        sections: item.data.content?.sections,
    }))
);

/* Each item should expose its own searching mechanism :
 * we may include/exclude certain fields or add extra criteria
 * depending on the type of item we're targeting */
const itemMatchers: ItemMatchMap = {
    login: matchesLoginItem,
    note: matchesNoteItem,
    alias: matchesAliasItem,
    creditCard: matchesCreditCardItem,
    identity: matchesIdentityItem,
    sshKey: matchesSSHItem,
    wifi: matchesWifiItem,
    custom: matchesCustomItem,
};

const matchItem: ItemMatch = <T extends ItemType>(item: ItemRevision<T>) => itemMatchers[item.data.type](item);

export const searchItems = <T extends ItemRevision>(items: T[], search?: string, rankByRelevance = false) => {
    if (!search || search.trim() === '') return items;

    /** split the search term into multiple normalized needles, dropping empties
     * so internal whitespace (e.g. "proton  mail") doesn't yield a `''` needle
     * that would disqualify every item */
    const needles = Array.from(new Set(normalize(search, true).split(/\s+/).filter(Boolean)));

    /** Score every item, keeping only matches (`score > 0`). When
     * `rankByRelevance` is set, results are ranked by relevance (highest score
     * first) with ties preserving the incoming order via a stable index
     * tie-breaker. Otherwise the match is used purely as a filter and the
     * incoming order - already sorted by the active sort option (recent,
     * title, ...) - is preserved, matching the mobile apps' behavior. */
    const matches: { item: T; score: number; index: number }[] = [];

    items.forEach((item, index) => {
        const score = matchItem(item)(needles);
        if (score > 0) matches.push({ item, score, index });
    });

    if (rankByRelevance) matches.sort((a, b) => b.score - a.score || a.index - b.index);

    return matches.map(({ item }) => item);
};
