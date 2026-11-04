// TODO: Import from @proton/shared
declare module 'ical.js';

declare module 'pm-srp';
declare module 'is-valid-domain';

declare module '@protontech/mimemessage' {
    interface MimeEntity {
        header(name: string, value: string): void;
        internalBody: string;
        toString(): string;
    }

    interface MimeMessage {
        factory(options?: Record<string, unknown>): MimeEntity;
    }

    const mimemessage: MimeMessage;
    export default mimemessage;
}

// Used to replace Node bundled punycode library which is now deprecated
declare module 'punycode.js';

// date-fns CJS internals
declare module 'date-fns/_lib/format/formatters';
declare module 'date-fns/_lib/format/longFormatters';

// Untyped webpack plugins
declare module 'webpack-bundle-analyzer';
declare module 'circular-dependency-plugin';
