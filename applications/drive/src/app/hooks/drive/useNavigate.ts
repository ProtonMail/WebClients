import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { LinkType } from '../../interfaces/link';
import { toLinkURLType } from '../../components/Drive/helpers';

function useNavigate() {
    const history = useHistory();
    const location = useLocation();

    const navigateToLink = useCallback(
        (shareId: string, linkId: string, type: LinkType) => {
            history.push(`/${shareId}/${toLinkURLType(type)}/${linkId}?r=${location.pathname}`);
        },
        [history, location.pathname]
    );

    const navigateToRoot = useCallback(() => {
        history.push(`/`);
    }, [history]);

    const navigateToSharedURLs = useCallback(() => {
        history.push(`/shared-urls`);
    }, [history]);

    const navigateToTrash = useCallback(() => {
        history.push(`/trash`);
    }, [history]);

    return {
        navigateToLink,
        navigateToRoot,
        navigateToSharedURLs,
        navigateToTrash,
    };
}

export default useNavigate;
