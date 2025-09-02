import type { Maybe } from '@proton/pass/types';

export const first = <T>(arr: T[]): Maybe<T> => arr?.[0];
