import longFormatters from 'date-fns/_lib/format/longFormatters/index';
import formatters from 'date-fns/_lib/format/formatters/index';
import defaultLocale from 'date-fns/locale/en-US';

/**
 * We copy here (with some refactor) the code for the format function from the 'date-fns' library.
 * What the format function from 'date-fns' does for extracting from a date (think of it as a UNIX timestamp)
 * the hours, day, month, etc that will be displayed, is to create a fake UTC time that mimics local time.
 * The days, hours, etc are then extracted with the JS functions Date.getUTCDate, Date.getUTCHours, and some
 * other UTC functions that date-fns has. This is achieved with the following lines of code in src/format/index.js:
 *
 *   // Convert the date in system timezone to the same date in UTC+00:00 timezone.
 *   // This ensures that when UTC functions will be implemented, locales will be compatible with them.
 *   // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376
 *   const timezoneOffset = getTimezoneOffsetInMilliseconds(originalDate)
 *   const utcDate = subMilliseconds(originalDate, timezoneOffset)
 *
 * We want a format function that treats a UTC date as it is, without artificially transforming it to a fake UTC time
 * that mimics local time. Because of DST issues, we cannot undo the timezone offset with a wrapper of the format function,
 * so for our formatUTC function we simply remove the problematic lines above.
 */

const escapedStringRegExp = /^'([^]*?)'?$/;
const doubleQuoteRegExp = /''/g;
const formattingTokensRegExp = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g;
const longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
const unescapedLatinCharacterRegExp = /[a-zA-Z]/;

const cleanEscapedString = (input) => {
    return input.match(escapedStringRegExp)[1].replace(doubleQuoteRegExp, "'");
};

const toInteger = (dirtyNumber) => {
    if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
        return NaN;
    }

    const number = Number(dirtyNumber);

    if (Number.isNaN(number)) {
        return number;
    }

    return number < 0 ? Math.ceil(number) : Math.floor(number);
};

/**
 * Same as the format function from date-fns, but formats in the "UTC timezone"
 * @param {Date} utcDate
 * @param {String} formatString
 * @param {Object} options
 * @returns {String}
 */
const formatUTC = (utcDate, formatString, options = {}) => {
    const locale = options.locale || defaultLocale;
    const localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
    const defaultFirstWeekContainsDate =
        localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
    const firstWeekContainsDate =
        options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate);
    const localeWeekStartsOn = locale.options && locale.options.weekStartsOn;
    const defaultWeekStartsOn = localeWeekStartsOn === null ? 0 : toInteger(localeWeekStartsOn);
    const weekStartsOn = options.weekStartsOn === null ? defaultWeekStartsOn : toInteger(options.weekStartsOn);
    const formatterOptions = { firstWeekContainsDate, weekStartsOn, locale, _originalDate: utcDate };

    const result = formatString
        .match(longFormattingTokensRegExp)
        .map((substring) => {
            const firstCharacter = substring[0];
            if (firstCharacter === 'p' || firstCharacter === 'P') {
                const longFormatter = longFormatters[firstCharacter];
                return longFormatter(substring, locale.formatLong, formatterOptions);
            }
            return substring;
        })
        .join('')
        .match(formattingTokensRegExp)
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
                return formatter(utcDate, substring, locale.localize, formatterOptions);
            }

            if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
                throw new Error(
                    'Format string contains an unescaped latin alphabet character `' + firstCharacter + '`'
                );
            }

            return substring;
        })
        .join('');

    return result;
};

export default formatUTC;
