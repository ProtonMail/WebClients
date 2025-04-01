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

    const page = useMemo(() => pageFromUrl(location), [location.hash]);

    const handlePage = useCallback((pageNumber: number) => {
        history.push(setPageInUrl(history.location, pageNumber));
    }, []);

    const handleBack = useCallback(() => {
        history.push(setParamsInLocation(history.location, { labelID }));
    }, [labelID]);

    const handleSort = useCallback((sort: Sort) => {
        history.push(setSortInUrl(history.location, sort));
    }, []);

    const handleFilter = useCallback((filter: Filter) => {
        history.push(setFilterInUrl(history.location, filter));
    }, []);

    return { page, handlePage, handleBack, handleSort, handleFilter };
};
