import { IcBriefcase } from '@proton/icons/icons/IcBriefcase';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { Audience } from '@proton/shared/lib/interfaces/Subscription';

import Benefits from '../../../../../single-signup-v2/Benefits';
import {
    getAppsIncludedBenefit,
    getBasedInSwitzerlandGDPRBenefit,
    getBenefits,
    getISO27001CertifiedBenefit,
    getJoinString,
    getOpenSourceAndAuditedBenefit,
    getTeamKnowsEncryptionBenefit,
    getWorksOnAllDevicesBenefit,
} from '../../../../../single-signup-v2/configuration/helper';

const BUSINESS_BENEFITS = [
    getOpenSourceAndAuditedBenefit(),
    getBasedInSwitzerlandGDPRBenefit(),
    getISO27001CertifiedBenefit(),
    getTeamKnowsEncryptionBenefit(),
    getWorksOnAllDevicesBenefit(),
    { ...getAppsIncludedBenefit(), icon: { component: IcBriefcase } },
];

export const BusinessBenefits = () => {
    return (
        <div className="business-benefits-card hidden md:block bg-norm w-full rounded-xl border border-weak overflow-hidden p-6">
            <p className="text-left text-semibold mt-0 mb-4">{getBenefits(BRAND_NAME)}</p>
            {/* Outside CheckoutForm's ui-prominent wrapper, so the icons' `color-primary` needs it too. */}
            <div className="ui-prominent bg-transparent">
                <Benefits features={BUSINESS_BENEFITS} />
            </div>
            <p className="mb-0 mt-4">{getJoinString(Audience.B2B)}</p>
        </div>
    );
};
