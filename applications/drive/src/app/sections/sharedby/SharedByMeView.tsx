import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
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
