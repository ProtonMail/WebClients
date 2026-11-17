import { UTCDate } from '@date-fns/utc';
import type { Day, FirstWeekContainsDate, Locale } from 'date-fns';
import { formatters, longFormatters } from 'date-fns/format';
import { enUS as defaultLocale } from 'date-fns/locale/en-US';

import type { WeekStartsOn } from './interface';

/**
 * A copy (with some refactor) of the format loop from 'date-fns', which formats a date as it is in UTC.
 * The date-fns formatters read the date with its local getters (getHours, getDate, ...), so they are given
 * a UTCDate, whose local getters return the UTC values. Unlike date-fns format, this does not throw on
 * invalid dates or on the protected week-year and day-of-year tokens (YYYY, DD).
 */

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

const cleanEscapedString = (input: string) => {
    const matcherResult = input.match(escapedStringRegExp);
    if (!matcherResult) {
        return '';
    }
    return matcherResult[1].replace(doubleQuoteRegExp, "'");
};

const toInteger = (dirtyNumber: any) => {
    if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
        return NaN;
    }

    const number = Number(dirtyNumber);

    if (Number.isNaN(number)) {
        return number;
    }

    return number < 0 ? Math.ceil(number) : Math.floor(number);
};

export interface Options {
    locale?: Locale;
    weekStartsOn?: WeekStartsOn;
    firstWeekContainsDate?: FirstWeekContainsDate;
    useAdditionalWeekYearTokens?: boolean;
    useAdditionalDayOfYearTokens?: boolean;
}
/**
 * Same as the format function from date-fns, but formats in the "UTC timezone"
 */
const formatUTC = (utcDate: Date, formatString: string, options: Options = {}) => {
    const locale = options.locale || defaultLocale;
    const localeFirstWeekContainsDate = locale.options?.firstWeekContainsDate;
    const defaultFirstWeekContainsDate =
        localeFirstWeekContainsDate === undefined ? 1 : toInteger(localeFirstWeekContainsDate);
    const firstWeekContainsDate =
        options.firstWeekContainsDate === undefined
            ? defaultFirstWeekContainsDate
            : toInteger(options.firstWeekContainsDate);
    const localeWeekStartsOn = locale?.options?.weekStartsOn;
    const defaultWeekStartsOn = localeWeekStartsOn === undefined ? 0 : toInteger(localeWeekStartsOn);
    const weekStartsOn = options.weekStartsOn === undefined ? defaultWeekStartsOn : toInteger(options.weekStartsOn);
    const date = new UTCDate(utcDate);
    const formatterOptions = {
        firstWeekContainsDate: firstWeekContainsDate as FirstWeekContainsDate,
        weekStartsOn: weekStartsOn as Day,
        locale,
    };

    const longFormatMatchResult = formatString.match(longFormattingTokensRegExp);
    if (!longFormatMatchResult) {
        return '';
    }

    const formattingTokensMatchResult = longFormatMatchResult
        .map((substring) => {
            const firstCharacter = substring[0];
            if (firstCharacter === 'p' || firstCharacter === 'P') {
                const longFormatter = longFormatters[firstCharacter];
                return longFormatter(substring, locale.formatLong);
            }
            return substring;
        })
        .join('')
        .match(formattingTokensRegExp);

    if (!formattingTokensMatchResult) {
        return '';
    }

    return formattingTokensMatchResult
        .map((substring) => {
            // Replace two single quote characters with one single quote character
            if (substring === "''") {
                return "'";
            }

            const firstCharacter = substring[0];
            if (firstCharacter === "'") {
                return cleanEscapedString(substring);
            }

            const formatter = formatters[firstCharacter];
            if (formatter) {
                return formatter(date, substring, locale.localize, formatterOptions);
            }

            if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
                throw new Error(`Format string contains an unescaped latin alphabet character \`${firstCharacter}\``);
            }

            return substring;
        })
        .join('');
};

export default formatUTC;
