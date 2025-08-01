import { useEffect } from 'react';

import { c } from 'ttag';

import { useAppTitle } from '@proton/components';

import { FileBrowserStateProvider } from '../../components/FileBrowser';
import ToolbarRow from '../../components/sections/ToolbarRow/ToolbarRow';
import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { SharedByMe } from './SharedByMe';
import { SharedByMeToolbar } from './SharedByMeToolbar';
import { useSharedByMeNodes } from './useSharedByMeNodes';

export const SharedByMeView = () => {
    useAppTitle(c('Title').t`Shared`);

    const { activeShareId, setDefaultRoot } = useActiveShare();
    useEffect(setDefaultRoot, []);

    const { isLoading, setSorting, sortParams, sharedByMeNodes, onRenderItem } = useSharedByMeNodes();

    return (
        <FileBrowserStateProvider itemIds={sharedByMeNodes.map((sharedByMeNode) => sharedByMeNode.id)}>
            <ToolbarRow
                titleArea={<span className="text-strong pl-1">{c('Info').t`My Links`}</span>}
                toolbar={<SharedByMeToolbar shareId={activeShareId} items={sharedByMeNodes} />}
            />
            <SharedByMe
                isLoading={isLoading}
                setSorting={setSorting}
                sortParams={sortParams}
                shareId={activeShareId}
                sharedByMeNodes={sharedByMeNodes}
                onRenderItem={onRenderItem}
            />
        </FileBrowserStateProvider>
    );
};
