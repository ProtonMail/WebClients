import { useMemo } from 'react';

import { type XorObfuscation, deobfuscate } from '../utils/obfuscate/xor';

export const useDeobfuscatedValue = (value: XorObfuscation) => useMemo(() => deobfuscate(value), [value.m, value.v]);
