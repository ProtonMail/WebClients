import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { pageFromUrl, setPageInUrl, setParamsInLocation } from 'proton-mail/helpers/mailboxUrl';

interface Props {
    labelID: string;
}

export const useRouterNavigation = ({ labelID }: Props) => {
    const location = useLocation();
    const history = useHistory();

    // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-7B666F
    const page = useMemo(() => pageFromUrl(location), [location.hash]);

    const handlePage = useCallback((pageNumber: number) => {
        history.push(setPageInUrl(history.location, pageNumber));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-D3EAE8
    }, []);

    const handleBack = useCallback(() => {
        history.push(setParamsInLocation(history.location, { labelID }));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-461938
    }, [labelID]);

    return { page, handlePage, handleBack };
};
