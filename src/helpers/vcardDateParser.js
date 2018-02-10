import _ from 'lodash';

/**
 * Parses a Vcard date according to https://tools.ietf.org/html/rfc6350#section-4.3.1
 * @param string Date string, e.g. YYYY-MM-DD
 * @returns {({day: string, month: string, year: string}|undefined)}
 */
function parseDate(string = '') {
    const parsers = [
        // [ISO.8601.2000] 5.2.1.3 d)
        { regex: /^--(\d{2})-?(\d{2})$/, cb: ([, month, day]) => ({ month, day }) },
        // [ISO.8601.2000] 5.2.1.3 e)
        { regex: /^--(\d{2})$/, cb: ([, month]) => ({ month }) },
        // [ISO.8601.2000] 5.2.1.3 f)
        { regex: /^---(\d{2})$/, cb: ([, day]) => ({ day }) },
        // [ISO.8601.2004] 4.1.2.3 a)
        { regex: /^(\d{4})-?(\d{2})$/, cb: ([, year, month]) => ({ year, month }) },
        // [ISO.8601.2004] 4.1.2.3 b)
        { regex: /^(\d{4})$/, cb: ([, year]) => ({ year }) },
        // [ISO.8601.2004] 4.1.2.2
        { regex: /^(\d{4})(\d{2})(\d{2})$/, cb: ([, year, month, day]) => ({ year, month, day }) },
        { regex: /^(\d{4})-(\d{2})-(\d{2})$/, cb: ([, year, month, day]) => ({ year, month, day }) }
    ];
    const { regex, cb } = _.find(parsers, ({ regex }) => regex.test(string)) || {};
    if (!regex) {
        return;
    }
    return cb(string.match(regex));
}

export default parseDate;
