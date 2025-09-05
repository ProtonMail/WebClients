import { getLocalesFromRequireContext } from '@proton/shared/lib/i18n/locales';

const requireContext = import.meta.webpackContext!('../../locales', {
    recursive: false,
    regExp: /\.json$/,
    mode: 'lazy',
    chunkName: 'locales/[request]',
});

const locales = getLocalesFromRequireContext(requireContext);

export default locales;
