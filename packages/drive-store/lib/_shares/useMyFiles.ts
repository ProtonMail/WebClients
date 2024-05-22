import { useDefaultShare } from '../../store';
import { useAbortSignal } from '../../store/_views/utils';
import { EnrichedError } from '../../utils/errorHandling/EnrichedError';
import { NodeMeta } from '../interface';

export const useMyFiles = () => {
    const abortSignal = useAbortSignal([]);
    const { getDefaultShare } = useDefaultShare();

    const getMyFilesNodeMeta = async (): Promise<NodeMeta> => {
        const defaultShare = await getDefaultShare(abortSignal);

        if (!defaultShare) {
            throw new EnrichedError('Unable to find default share');
        }

        return {
            volumeId: defaultShare.volumeId,
            linkId: defaultShare.rootLinkId,
        };
    };

    return { getMyFilesNodeMeta };
};
