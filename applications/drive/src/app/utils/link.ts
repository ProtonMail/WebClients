import { SharedURLFlags } from '../interfaces/sharing';

export const isCustomSharedURLPassword = (sharedURL: { Flags?: number }) => {
    return !!(typeof sharedURL.Flags !== 'undefined' && sharedURL.Flags & SharedURLFlags.CustomPassword);
};
