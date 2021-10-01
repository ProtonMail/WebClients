import { ShareFlags } from '../../interfaces/drive/share';

export const isPrimaryShare = (meta: { Flags?: number }) => {
    return !!(typeof meta.Flags !== 'undefined' && meta.Flags & ShareFlags.PrimaryShare);
};
