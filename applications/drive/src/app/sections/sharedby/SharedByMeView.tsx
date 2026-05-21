import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import { useActiveShare } from '../../legacy/hooks/drive/useActiveShare';
import { ToolbarRow } from '../../statelessComponents/ToolbarRow/ToolbarRow';
import { SharedByMe } from './SharedByMe';
import SharedByMeToolbar from './SharedByMeToolbar';
import { loadSharedByMeNodes } from './loaders/loadSharedByMeNodes';

// TODO: Remove useActiveShare after we remove the need of shareId for ShareButton
export const SharedByMeView = () => {
    useAppTitle(c('Title').t`Shared`);
    const { setDefaultRoot } = useActiveShare();

    useEffect(setDefaultRoot, []);

    useEffect(() => {
        const abortController = new AbortController();
        void loadSharedByMeNodes(abortController.signal);

        return () => {
            abortController.abort();
        };
    }, []);

    return (
        <>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`My Links`}</span>}
                toolbar={<SharedByMeToolbar />}
            />
            <SharedByMe />
        </>
    );
};
