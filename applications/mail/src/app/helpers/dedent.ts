/**
 * Clean template
 * @link {https://gist.github.com/dhoko/4b0c20e66c8a3f1aa431}
 */
export const dedentTpl = (callSite: TemplateStringsArray, ...args: string[]) => {
    function format(str = '') {
        let size = -1;
        return str.replace(/\n(\s+)/g, (m, m1) => {
            if (size < 0) {
                size = m1.replace(/\t/g, '    ').length;
            }
            return '\n' + m1.slice(Math.min(m1.length, size));
        });
    }
    // TODO: Could this append with TS?
    // if (typeof callSite === 'string') {
    //     return format(callSite);
    // }
    // if (typeof callSite === 'function') {
    //     return (...args: string[]) => format(callSite(...args));
    // }
    const output = callSite
        .slice(0, args.length + 1)
        .map((text, i) => (i === 0 ? '' : args[i - 1]) + text)
        .join('');
    return format(output);
};
