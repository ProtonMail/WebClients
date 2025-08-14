// FIXME: this is duplicated code across all apps. Consider refactoring.
import { getLocalesFromRequireContext } from '@proton/shared/lib/i18n/locales';

// @ts-ignore
const requireContext = import.meta.webpackContext!('../../locales', {
    recursive: false,
    regExp: /\.json$/,
    mode: 'lazy',
    chunkName: 'locales/[request]',
});

const locales = getLocalesFromRequireContext(requireContext);

export default locales;
