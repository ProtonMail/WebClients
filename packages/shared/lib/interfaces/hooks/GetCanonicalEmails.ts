import { SimpleMap } from '../utils';

export type GetCanonicalEmails = (emails: string[]) => Promise<SimpleMap<string>>;
