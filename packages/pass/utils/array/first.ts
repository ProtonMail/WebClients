import type { Maybe } from '../../types/utils';

export const first = <T>(arr: T[]): Maybe<T> => arr?.[0];
