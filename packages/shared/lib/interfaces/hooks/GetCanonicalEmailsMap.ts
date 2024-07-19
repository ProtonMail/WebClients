import type { SimpleMap } from '../utils';

export type GetCanonicalEmailsMap = (emails: string[]) => Promise<SimpleMap<string>>;
