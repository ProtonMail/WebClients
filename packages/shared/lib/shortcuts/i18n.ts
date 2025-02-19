import { c } from 'ttag';

export const getKeyboardShortcutsWithAppName = (appName: string) => {
    return c('Title').t`${appName} keyboard shortcuts`;
};
