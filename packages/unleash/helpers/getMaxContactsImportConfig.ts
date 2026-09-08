import { getStandaloneUnleashClient } from '../standaloneClient';
import { resolveMaxContactsImportConfig } from './resolveMaxContactsImportConfig';

export const getMaxContactsImportConfig = (): number => resolveMaxContactsImportConfig(getStandaloneUnleashClient());
