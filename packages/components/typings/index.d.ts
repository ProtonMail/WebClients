declare module '*.svg';

declare module '*.jpg';

declare module '*.md';

// TODO: Import from @proton/shared
declare module 'ical.js';

declare module 'squire-rte';

declare module 'pm-srp';

declare module 'is-valid-domain';

// Broken types from imagemin-webpack-plugin
declare module 'svgo' {
    export interface Options {}
}
