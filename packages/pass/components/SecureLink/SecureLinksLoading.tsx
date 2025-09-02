import type { PropsWithChildren } from 'react';
import type { FC } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms';
import { secureLinksGet } from '@proton/pass/store/actions';
import { selectRequestInFlight } from '@proton/pass/store/selectors';

export const SecureLinksLoading: FC<PropsWithChildren> = ({ children }) => {
    const loading = useSelector(selectRequestInFlight(secureLinksGet.requestID()));
    return loading ? <CircleLoader size="small" /> : children;
};
