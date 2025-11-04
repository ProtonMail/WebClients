import { useCallback, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import type { Filter, Sort } from '@proton/shared/lib/mail/search';

import {
    pageFromUrl,
    setFilterInUrl,
    setPageInUrl,
    setParamsInLocation,
    setSortInUrl,
} from 'proton-mail/helpers/mailboxUrl';

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

    const handleSort = useCallback((sort: Sort) => {
        history.push(setSortInUrl(history.location, sort));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-1A7C27
    }, []);

    const handleFilter = useCallback((filter: Filter) => {
        history.push(setFilterInUrl(history.location, filter));
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-0C6A79
    }, []);

    return { page, handlePage, handleBack, handleSort, handleFilter };
};
