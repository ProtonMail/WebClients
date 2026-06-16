import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';

import { Loader } from '@proton/components';
import { getDrive, splitNodeUid } from '@proton/drive';

import useDriveNavigation from '../legacy/hooks/drive/useNavigate';
import { Preview } from '../modals/preview';

interface PreviewContainerProps {
    shareId: string;
    nodeUid: string | undefined;
}

export function PreviewContainer({ shareId, nodeUid }: PreviewContainerProps) {
    const [parentFolderId, setParentFolderId] = useState<string | undefined>();

    const { navigateToLink, navigateToRoot } = useDriveNavigation();
    const navigate = useNavigate();

    // Using Drive client as a context as only normal files have a file URL.
    const drive = getDrive();

    useEffect(() => {
        if (!nodeUid) {
            return;
        }
        void drive.getNode(nodeUid).then((node) => {
            if (node.parentUid) {
                const { nodeId } = splitNodeUid(node.parentUid);
                setParentFolderId(nodeId);
            }
        });
    }, [drive, nodeUid]);

    if (!nodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    return (
        <Preview
            drive={drive}
            nodeUid={nodeUid}
            onClose={() => {
                const referer = new URLSearchParams(window.location.search).get('r');
                if (referer) {
                    navigate(referer);
                } else if (parentFolderId) {
                    navigateToLink(shareId, parentFolderId, false);
                } else {
                    navigateToRoot();
                }
            }}
        />
    );
}
