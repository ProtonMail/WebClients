import { type FC, useEffect } from 'react';
import { type RouteChildrenProps, useHistory } from 'react-router-dom';

import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';

import { BreachGroupList } from './Group/BreachGroupList';

type Props = RouteChildrenProps<{ type: AddressType }>;

const FALLBACK = AddressType.PROTON;

const validateType = (type?: string): type is AddressType =>
    type !== undefined && Object.values<string>(AddressType).includes(type);

export const BreachGroup: FC<Props> = ({ match }) => {
    const type = validateType(match?.params.type) ? match.params.type : null;
    const { title, data, loading } = useBreachesTable(type ?? FALLBACK);
    const history = useHistory();

    useEffect(() => {
        if (!type) history.replace(getLocalPath(`monitor/dark-web/${FALLBACK}`));
    }, [type]);

    return (
        <>
            <SubHeader title={title} className="shrink-0 mb-3" />
            <BreachGroupList data={data} loading={loading} />
        </>
    );
};
