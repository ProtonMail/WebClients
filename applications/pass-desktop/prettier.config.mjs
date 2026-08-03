import config from '@proton/prettier-config-proton';

// proton-pass-* and proton-pass-desktop-native are internal aliases that the
// shared config doesn't know about yet. Insert them right after every @proton/*
// entry so they sort as internal modules. Remove this override once the shared
// config is updated monorepo-wide.
const insertAfter = (arr, anchor, ...items) => {
    const idx = arr.findIndex((s) => s === anchor);
    if (idx === -1) return [...arr, ...items];
    return [...arr.slice(0, idx + 1), ...items, ...arr.slice(idx + 1)];
};

const importOrder = insertAfter(
    config.importOrder,
    '^@proton/(?!.*\\.(?:css|scss)$).*$',
    '^proton-pass(?!.*\\.(?:css|scss)$).*$'
);

export default { ...config, importOrder };
