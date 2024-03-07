import { generateKey } from '@proton/pass/lib/crypto/utils/crypto-helpers';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';

/* The `EXTENSION_KEY` is a random & unique identifier for the current
 * extension runtime. It is currently used for verifiying the origin of
 * messages sent through unsecure channels (ie: iframe postmessaging).
 * see: `IFrameContextProvider.tsx` */
export const EXTENSION_KEY = uint8ArrayToBase64String(generateKey());
