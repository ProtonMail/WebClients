/**
 * Jest seems to never resolve the 'import' condition from the package.json `exports`,
 * and instead it only looks for e.g. ['node', 'require', 'default', 'browser'].
 * We force the resolver to also consider the 'import' field, if the default resolution method fails.
 * However, this means that the CJS conditions always have priority in the module resolution,
 * which might cause unexpected issues in some packages (but not in the ones we currently use).
 */
const PREFER_DEFAULT_EXPORT = new Set(['vega-canvas']);

function getPackageName(request) {
    if (request.startsWith('@')) {
        const [scope, name] = request.split('/');
        return scope && name ? `${scope}/${name}` : request;
    }

    return request.split('/')[0];
}

module.exports = function (request, options) {
    const packageName = getPackageName(request);

    if (PREFER_DEFAULT_EXPORT.has(packageName)) {
        return options.defaultResolver(request, {
            ...options,
            conditions: ['default', 'import'],
        });
    }

    try {
        return options.defaultResolver(request, options);
    } catch (err) {
        if (options.conditions) {
            return options.defaultResolver(request, { ...options, conditions: ['import'] });
        }

        throw err;
    }
};
