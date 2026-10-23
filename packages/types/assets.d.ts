declare module '*.svg';
declare module '*.jpg';
declare module '*.png';
declare module '*.webm';
declare module '*.mp4';
declare module '*.md';
declare module '*.scss';
declare module '*.css';
declare module '*.raw.scss';
declare module '*.csv';
declare module '*.webp';

// TODO: Import from @proton/shared
declare module 'ical.js';
declare module 'pm-srp';
declare module 'is-valid-domain';
// Used to replace Node bundled punycode library which is now deprecated
declare module 'punycode.js';

// Provided by `SandboxedLibrariesPlugin` (@proton/drive): sandboxed library name -> emitted filename
declare module 'proton-sandboxed-libraries' {
    const manifest: Record<string, string>;
    export default manifest;
}
