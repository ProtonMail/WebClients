import { ContactEmailsModel } from 'proton-shared/lib/models/contactEmailsModel';
import createUseModelHook from './helpers/createModelHook';

export const useContactEmails = createUseModelHook(ContactEmailsModel);
