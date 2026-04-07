/**
 * Jest seems to never resolve the 'import' condition from the package.json `exports`,
 * and instead it only looks for e.g. ['node', 'require', 'default', 'browser'].
 * Since we rely on babel to transform ESM file, we can force the resolver to also consider
 * the 'import' field, if the default resolution method fails.
 * However, this means that the CJS conditions always have priority in the module resolution,
 * which might cause unexpected issues in some packages (but not in the ones we currently use).
 */
module.exports = function (request, options) {
    try {
        return options.defaultResolver(request, options);
    } catch (err) {
        if (options.conditions) {
            return options.defaultResolver(request, { ...options, conditions: ['import'] });
        }
    }
};
