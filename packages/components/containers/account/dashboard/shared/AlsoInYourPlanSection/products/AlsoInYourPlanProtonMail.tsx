import { useContext } from 'react';

import { c } from 'ttag';

import { APPS, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import MailLogo from '../../../../../../components/logo/MailLogo';
import {
    getDarkWebMonitoringFeature,
    getNAddressesFeature,
    getNDomainsFeature,
} from '../../../../../payments/features/mail';
import { AlsoInYourPlanSectionContext } from '../AlsoInYourPlanSection';
import AlsoInYourPlanSectionCard from '../AlsoInYourPlanSectionCard';
import mail from '../illustrations/mail.jpg';

const AlsoInYourPlanProtonMail = () => {
    const planSectionContext = useContext(AlsoInYourPlanSectionContext);

    if (!planSectionContext) {
        return null;
    }

    const { app, plan, isBundlePlan } = planSectionContext;

    const cardConfig = {
        app: APPS.PROTONMAIL,
        copy: () => c('Dashboard').t`Communicate and schedule with end-to-end encryption.`,
        image: mail,
        buttonCopy: () => goToPlanOrAppNameText(MAIL_APP_NAME),
        logo: <MailLogo />,
        features: [
            getNAddressesFeature({ n: plan?.MaxAddresses || 0 }),
            getNDomainsFeature({ n: plan?.MaxDomains || 0 }),
            getDarkWebMonitoringFeature(),
        ],
    };

    return <AlsoInYourPlanSectionCard app={app} config={cardConfig} shouldDisplayAllFeatures={isBundlePlan} />;
};

export default AlsoInYourPlanProtonMail;
