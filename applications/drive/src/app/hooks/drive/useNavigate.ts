import { useCallback } from 'react';
import { useHistory } from 'react-router-dom';
import { LinkType } from '../../interfaces/link';
import { toLinkURLType } from '../../components/Drive/helpers';

function useNavigate() {
    const history = useHistory();

    const navigateToLink = useCallback(
        (shareId: string, linkId: string, type: LinkType) => {
            history.push(`/${shareId}/${toLinkURLType(type)}/${linkId}`);
        },
        [history]
    );

    const navigateToRoot = useCallback(() => {
        history.push(`/`);
    }, [history]);

    return {
        navigateToLink,
        navigateToRoot,
    };
}

export default useNavigate;
