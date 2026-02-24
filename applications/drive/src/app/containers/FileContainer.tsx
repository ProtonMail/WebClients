import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { c } from 'ttag';

import { Loader, useNotifications } from '@proton/components';
import { NodeType, ValidationError, getDrive } from '@proton/drive/index';
import useLoading from '@proton/hooks/useLoading';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import { useLegacyContextShareHandler } from '../hooks/drive/useLegacyContextShareHandler';
import useDriveNavigation from '../hooks/drive/useNavigate';
import { EnrichedError } from '../utils/errorHandling/EnrichedError';
import { handleSdkError } from '../utils/errorHandling/handleSdkError';
import PreviewContainer from './PreviewContainer';

export function FileContainer() {
    const [isLoading, withLoading] = useLoading(true);
    const { navigateToRoot } = useDriveNavigation();
    const { handleContextShare } = useLegacyContextShareHandler();
    const { shareId, linkId } = useParams<DriveSectionRouteProps>();
    const [nodeUid, setNodeUid] = useState<string | undefined>();
    const { createNotification } = useNotifications();

    useEffect(() => {
        const abortController = new AbortController();

        void withLoading(async () => {
            if (!shareId || !linkId) {
                handleSdkError(
                    new EnrichedError('Drive is not initialized, cache has been cleared unexpectedly', {
                        extra: {
                            reason: 'Missing URL parameters',
                        },
                    })
                );
                navigateToRoot();
                return;
            }

            try {
                const uid = await getDrive().getNodeUid(shareId, linkId);
                setNodeUid(uid);
            } catch (err: unknown) {
                if (err instanceof ValidationError && err.code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
                    await handleContextShare(abortController.signal, {
                        shareId,
                        linkId,
                        type: NodeType.File,
                    });
                    return;
                }
                console.error(Error.isError(err) ? err.message : 'Unknown issue while retrieving the file');
                createNotification({
                    type: 'error',
                    text: c('Error').t`We cannot retrieve this item`,
                });
                navigateToRoot();
            }
        });

        return () => {
            abortController.abort();
        };
    }, [shareId, linkId, withLoading, navigateToRoot, handleContextShare, createNotification]);

    if (!shareId || !linkId) {
        return null;
    }

    if (isLoading || !nodeUid) {
        return <Loader size="medium" className="absolute inset-center" />;
    }

    return <PreviewContainer shareId={shareId} nodeUid={nodeUid} />;
}
