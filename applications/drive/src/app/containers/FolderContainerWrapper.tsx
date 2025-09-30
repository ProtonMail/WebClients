import { useEffect } from 'react';
import { useParams } from 'react-router-dom-v5-compat';

import { Loader } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { LinkURLType } from '@proton/shared/lib/drive/constants';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import type { DriveSectionRouteProps } from '../components/sections/Drive/DriveView';
import useDriveNavigation from '../hooks/drive/useNavigate';
import { useContextShareHandler, useDefaultShare } from '../store';
import { FolderContainer, hasValidLinkType } from './FolderContainer';

export const FolderContainerWrapper = ({ type }: { type: LinkURLType }) => {
    const { isShareAvailable } = useDefaultShare();
    const [isLoading, withLoading] = useLoading(true);
    const { navigateToRoot } = useDriveNavigation();
    const { handleContextShare } = useContextShareHandler();
    const { shareId, linkId } = useParams<DriveSectionRouteProps>();

    useEffect(() => {
        const abortController = new AbortController();
        void withLoading(async () => {
            if (!shareId || !linkId || !type || !hasValidLinkType(type)) {
                return;
            }
            await isShareAvailable(abortController.signal, shareId).catch(async (err) => {
                if (err.data?.Code === API_CUSTOM_ERROR_CODES.NOT_ALLOWED) {
                    await handleContextShare(abortController.signal, {
                        shareId,
                        linkId,
                        isFile: type === LinkURLType.FILE,
                    });
                    return;
                }
                console.warn('Provided share is not available, probably locked or soft deleted');
                navigateToRoot();
                return;
            });
        });
        return () => {
            abortController.abort();
        };
    }, [shareId, type, linkId]);

    if (isLoading) {
        return <Loader size="medium" className="absolute inset-center" />;
    }
    return <FolderContainer type={type} />;
};
