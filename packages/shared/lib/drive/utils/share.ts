import { ShareFlags } from '../../interfaces/drive/share';

export const isMainShare = (meta: { Flags?: number }) => {
    return !!(typeof meta.Flags !== 'undefined' && meta.Flags & ShareFlags.MainShare);
};
