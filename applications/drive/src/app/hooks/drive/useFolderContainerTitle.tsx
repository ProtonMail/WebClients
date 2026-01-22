import { useAppTitle } from '@proton/components';

import { useLinkName } from '../../store/_views/utils';

export const useFolderContainerTitle = (params: { shareId?: string; linkId?: string }) => {
    const name = useLinkName(params.shareId || '', params.linkId || '');
    useAppTitle(name);
};
