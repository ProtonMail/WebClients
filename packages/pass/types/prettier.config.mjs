/* eslint-disable import/no-extraneous-dependencies -- dev-only Prettier config */
import config from '@proton/prettier-config-proton';

/** `experimentalTernaries` improves readability for
 * generated Pass API conditional types */
export default { ...config, experimentalTernaries: true };
