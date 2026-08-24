import type { Maybe } from '../../types';

export const first = <T>(arr: T[]): Maybe<T> => arr?.[0];
