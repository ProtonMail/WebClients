import { disableBrowserProxyTrap } from '@proton/pass/globals/browser';

/* Since content-scripts cannot be inspected, it is safe to disable the
 * browser API trap in this context. Additionally, content-scripts have
 * access to a dedicated execution context with a proxy to the window object,
 * so even if this flag is set, it won't be inspectable in the console where
 * this script is running. See `@pass/globals/browser.ts` */
disableBrowserProxyTrap();
