import type { ImportContactsModel } from '@proton/shared/lib/interfaces/contacts/Import';
import { IMPORT_STEPS } from '@proton/shared/lib/interfaces/contacts/Import';

export const getInitialState = (): ImportContactsModel => ({
    step: IMPORT_STEPS.ATTACHING,
    parsedVcardContacts: [],
    importedContacts: [],
    totalEncrypted: 0,
    totalImported: 0,
    errors: [],
    categories: [],
    loading: false,
});
