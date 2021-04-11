import { FormattedContact } from './FormattedContact';

export interface MergeModel {
    orderedContacts: FormattedContact[][];
    isChecked: {
        [ID: string]: boolean;
    };
    beDeleted: {
        [ID: string]: boolean;
    };
}
