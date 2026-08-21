const MONOREPO_ROOTS = ['applications', 'packages', 'tests'];

export const normalizePackagePath = (packagePath) => {
    let normalized = packagePath.replace(/\\/g, '/');

    if (normalized.endsWith('/package.json')) {
        normalized = normalized.slice(0, -'/package.json'.length);
    } else if (normalized === 'package.json') {
        normalized = '';
    }

    return normalized;
};

export const checkNestedPackagePath = (packageDirPath, allowedPaths = []) => {
    const normalized = normalizePackagePath(packageDirPath);

    if (!normalized) {
        return { isViolation: false, category: null };
    }

    for (const root of MONOREPO_ROOTS) {
        const prefix = `${root}/`;

        if (!normalized.startsWith(prefix)) {
            continue;
        }

        const remainder = normalized.slice(prefix.length);
        const segments = remainder.split('/').filter(Boolean);

        if (segments.length <= 1) {
            return { isViolation: false, category: root };
        }

        if (allowedPaths.includes(normalized)) {
            return { isViolation: false, category: root };
        }

        return { isViolation: true, category: root };
    }

    return { isViolation: false, category: null };
};
