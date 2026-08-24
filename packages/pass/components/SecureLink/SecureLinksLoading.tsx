import type { FC, PropsWithChildren } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms/CircleLoader/CircleLoader';

import { secureLinksGet } from '../../store/actions';
import { selectRequestInFlight } from '../../store/selectors';

export const SecureLinksLoading: FC<PropsWithChildren> = ({ children }) => {
    const loading = useSelector(selectRequestInFlight(secureLinksGet.requestID()));
    return loading ? <CircleLoader size="small" /> : children;
};
