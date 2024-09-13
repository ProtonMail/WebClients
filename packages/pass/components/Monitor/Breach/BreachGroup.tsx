import { type FC, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { type RouteChildrenProps, useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { Card } from '@proton/atoms';
import { usePassCore } from '@proton/pass/components/Core/PassCoreProvider';
import { SubHeader } from '@proton/pass/components/Layout/Section/SubHeader';
import { CustomAddressAddButton } from '@proton/pass/components/Monitor/Address/CustomAddressAddButton';
import { getLocalPath } from '@proton/pass/components/Navigation/routing';
import { useBreachesTable } from '@proton/pass/hooks/monitor/useBreachesTable';
import { AddressType } from '@proton/pass/lib/monitor/types';
import { selectHasCustomDomains } from '@proton/pass/store/selectors';
import { TelemetryEventName } from '@proton/pass/types/data/telemetry';

import { BreachGroupList } from './Group/BreachGroupList';
import { BreachGroupToggleButton } from './Group/BreachGroupToggleButton';

type Props = RouteChildrenProps<{ type: AddressType }>;

const FALLBACK = AddressType.PROTON;

const validateType = (type?: string): type is AddressType =>
    type !== undefined && Object.values<string>(AddressType).includes(type);

export const BreachGroup: FC<Props> = ({ match }) => {
    const history = useHistory();
    const { onTelemetry } = usePassCore();
    const customDomains = useSelector(selectHasCustomDomains);
    const type = validateType(match?.params.type) ? match.params.type : null;
    const { title, data, loading } = useBreachesTable(type ?? FALLBACK);

    useEffect(() => {
        if (!type) history.replace(getLocalPath(`monitor/dark-web/${FALLBACK}`));
    }, [type]);

    useEffect(() => {
        switch (type) {
            case AddressType.PROTON:
                onTelemetry(TelemetryEventName.PassMonitorDisplayMonitoringProtonAddresses, {}, {});
                break;
            case AddressType.ALIAS:
                onTelemetry(TelemetryEventName.PassMonitorDisplayMonitoringEmailAliases, {}, {});
                break;
        }
    }, []);

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
                {type === AddressType.ALIAS && customDomains && (
                    <Card rounded background={false} className="mb-3 color-weak">{c('Info')
                        .t`Aliases with custom domains are not monitored, please add them as a custom email for monitoring.`}</Card>
                )}
                <BreachGroupList data={data} loading={loading} />
            </>
        )
    );
};
