import type { KeyGenConfig, KeyGenConfigV6 } from '../interfaces';
import type { GenerateAddressKeyArguments } from './addressKeys';
import { generateAddressKey } from './addressKeys';

export const USER_KEY_USERID = 'not_for_email_use@domain.tld';

export const generateUserKey = async <C extends KeyGenConfig | KeyGenConfigV6>(args: Omit<GenerateAddressKeyArguments<C>, 'email' | 'name'>) => {
    return generateAddressKey({ email: USER_KEY_USERID, ...args });
};
