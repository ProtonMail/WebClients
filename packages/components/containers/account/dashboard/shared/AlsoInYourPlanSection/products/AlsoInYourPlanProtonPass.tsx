import { useContext } from 'react';

import { c } from 'ttag';

import PassLogo from '@proton/components/components/logo/PassLogo';
import {
    PASS_PLUS_VAULT_SHARING,
    get2FAAuthenticator,
    getLoginsAndNotes,
    getVaultSharing,
} from '@proton/components/containers/payments/features/pass';
import { APPS, PASS_APP_NAME } from '@proton/shared/lib/constants';
import { goToPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { AlsoInYourPlanSectionContext } from '../AlsoInYourPlanSection';
import AlsoInYourPlanSectionCard from '../AlsoInYourPlanSectionCard';
import pass from '../illustrations/pass.jpg';

const AlsoInYourPlanProtonPass = () => {
    const planSectionContext = useContext(AlsoInYourPlanSectionContext);

    if (!planSectionContext) {
        return null;
    }

    const { app, isBundlePlan } = planSectionContext;

    const cardConfig = {
        app: APPS.PROTONPASS,
        copy: () => c('Dashboard').t`Set secure passwords without the hassle.`,
        image: pass,
        buttonCopy: () => goToPlanOrAppNameText(PASS_APP_NAME),
        logo: <PassLogo />,
        features: [getLoginsAndNotes('paid'), getVaultSharing(PASS_PLUS_VAULT_SHARING), get2FAAuthenticator(true)],
    };

    return <AlsoInYourPlanSectionCard app={app} config={cardConfig} shouldDisplayAllFeatures={isBundlePlan} />;
};

export default AlsoInYourPlanProtonPass;
