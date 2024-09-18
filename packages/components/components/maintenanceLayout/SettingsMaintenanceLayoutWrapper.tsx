import type { ReactNode } from 'react';

import { c } from 'ttag';

import { PrivateMainSettingsAreaBase } from '@proton/components/containers/layout/PrivateMainSettingsArea';
import errorImg from '@proton/styles/assets/img/errors/error-generic.svg';
import { type FeatureFlag, useFlag } from '@proton/unleash';

import type { SettingsAreaConfig } from '../../containers/layout/interface';

interface Props {
    config: SettingsAreaConfig;
    maintenanceFlag: FeatureFlag;
    isSubsection?: boolean;
    children: ReactNode;
}

const MaintenanceLayout = () => {
    return (
        <div className="max-w-custom border rounded-xl p-8 rounded-xl text-center" style={{ '--max-w-custom': '24em' }}>
            <img
                src={errorImg}
                alt={c('Maintenance mode').t`This feature is temporarily unavailable`}
                className="mb-4"
            />
            <h2 className="text-semibold text-rg m-0 mb-2">{c('Maintenance mode')
                .t`This feature is temporarily unavailable`}</h2>
            <p className="m-0">{c('Maintenance mode').t`Please check back in a few minutes.`}</p>
        </div>
    );
};

const SettingsMaintenanceLayoutWrapper = ({ config, isSubsection, children, maintenanceFlag }: Props) => {
    const isInMaintenance = useFlag(maintenanceFlag);

    if (isInMaintenance) {
        return (
            <>
                {isSubsection ? (
                    <MaintenanceLayout />
                ) : (
                    <PrivateMainSettingsAreaBase title={config.text} description={config.description}>
                        <MaintenanceLayout />
                    </PrivateMainSettingsAreaBase>
                )}
            </>
        );
    }

    return <>{children}</>;
};

export default SettingsMaintenanceLayoutWrapper;
