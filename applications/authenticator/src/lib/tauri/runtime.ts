import { fetch as tauriFetch } from '@tauri-apps/plugin-http';

import { isLinux, isWindows } from '@proton/shared/lib/helpers/browser';

const isTauri = Object.hasOwn(window, '__TAURI_INTERNALS__');

const platform = (() => {
    if (isWindows()) return 'windows' as const;
    if (isLinux()) return 'linux' as const;
})();

let isGlobalFetchPatched = false;

(() => {
    if (isTauri) {
        /** disable context menus */
        document.addEventListener('contextmenu', (e) => e.preventDefault());

        if (!isGlobalFetchPatched) {
            isGlobalFetchPatched = true;
            window.fetch = new Proxy(window.fetch, {
                apply: (original, that, args: Parameters<typeof window.fetch>) => {
                    const [dest, opts] = args;
                    const url = (() => {
                        if (dest instanceof URL) return dest;
                        if (dest instanceof Request) return new URL(dest.url);
                        return new URL(dest, dest.includes('://') ? undefined : window.location.href);
                    })();

                    if (url.protocol !== 'https:' || !url.hostname.includes('proton')) {
                        return original.apply(that, args);
                    }

                    return tauriFetch(dest, opts);
                },
            });
        }
    }
})();

export default { isTauri, platform };
