import { type FC, useEffect } from 'react';
import { type RouteChildrenProps, useHistory } from 'react-router-dom';

import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { CustomAddressAddButton } from '@proton/pass/components/Monitor/Address/CustomAddressAddButton';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';

import { BreachGroupList } from './Group/BreachGroupList';
import { BreachGroupToggleButton } from './Group/BreachGroupToggleButton';

type Props = RouteChildrenProps<{ type: AddressType }>;

const FALLBACK = AddressType.PROTON;

const validateType = (type?: string): type is AddressType =>
    type !== undefined && Object.values<string>(AddressType).includes(type);

export const BreachGroup: FC<Props> = ({ match }) => {
    const history = useHistory();
    const type = validateType(match?.params.type) ? match.params.type : null;
    const { title, data, loading } = useBreachesTable(type ?? FALLBACK);

    useEffect(() => {
        if (!type) history.replace(getLocalPath(`monitor/dark-web/${FALLBACK}`));
    }, [type]);

    return (
        type && (
            <>
                <SubHeader
                    title={title}
                    className="mb-3"
                    actions={
                        <>
                            {type === AddressType.CUSTOM && <CustomAddressAddButton />}
                            {type !== AddressType.CUSTOM && <BreachGroupToggleButton type={type} />}
                        </>
                    }
                />
                <BreachGroupList data={data} loading={loading} />
            </>
        )
    );
};
