import { useState } from 'react';
import { c } from 'ttag';
import { APPS } from '@proton/shared/lib/constants';

import { SettingsLink } from '../../components';
import { useFeature, useUser } from '../../hooks';
import { FeatureCode } from '../features';
import { useNewDomainOptIn, getShowNewDomainSection } from '../addresses';

import TopBanner from './TopBanner';

const NewDomainTopBanner = () => {
    const [user] = useUser();
    const [Domain] = useNewDomainOptIn();
    const show = getShowNewDomainSection({ user, domain: Domain });

    const { feature: newDomainOptIn, update: setNewDomainOptIn } = useFeature<boolean>(FeatureCode.NewDomainOptIn);
    const [isDismissed, setIsDismissed] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        void setNewDomainOptIn(false);
    };

    if (!show || newDomainOptIn?.Value !== true || isDismissed) {
        return null;
    }

    const { Name } = user;
    const addressToCreate = `${Name}@${Domain}`;

    return (
        <TopBanner className="bg-info" onClose={handleDismiss}>
            {c('Info').t`Add ${addressToCreate} to your account for free, for a limited time only.`}{' '}
            <SettingsLink path="/identity-addresses" app={APPS.PROTONMAIL}>{c('Link').t`Activate`}</SettingsLink>
        </TopBanner>
    );
};

export default NewDomainTopBanner;
