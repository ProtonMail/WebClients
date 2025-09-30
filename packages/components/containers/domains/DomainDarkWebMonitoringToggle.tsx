import { useId } from 'react';

import { c } from 'ttag';

import { syncDomain } from '@proton/account/domains/actions';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { useDispatch } from '@proton/redux-shared-store';
import { disableDomainBreachAlert, enableDomainBreachAlert } from '@proton/shared/lib/api/breaches';
import { DARK_WEB_MONITORING_NAME } from '@proton/shared/lib/constants';
import type { Domain } from '@proton/shared/lib/interfaces';

interface Props {
    domain: Domain;
    disabled?: boolean;
}

const DomainDarkWebMonitoringToggle = ({ domain, disabled = false }: Props) => {
    const api = useApi();
    const dispatch = useDispatch();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const isEnabled = domain.Flags?.['dark-web-monitoring'] || false;

    const handleToggle = async () => {
        if (isEnabled) {
            await api(disableDomainBreachAlert(domain.ID));
            createNotification({ text: c('Notification').t`Monitoring disabled` });
        } else {
            await api(enableDomainBreachAlert(domain.ID));
            createNotification({ text: c('Notification').t`Monitoring enabled` });
        }
        await dispatch(syncDomain(domain));
    };

    const toggleId = useId();

    return (
        <>
            <label className="sr-only" htmlFor={toggleId}>
                {c('Label').t`Enable ${DARK_WEB_MONITORING_NAME} for ${domain.DomainName}`}
            </label>
            <Toggle
                id={toggleId}
                checked={isEnabled}
                onChange={() => withLoading(handleToggle())}
                disabled={disabled}
                loading={loading}
            />
        </>
    );
};

export default DomainDarkWebMonitoringToggle;
