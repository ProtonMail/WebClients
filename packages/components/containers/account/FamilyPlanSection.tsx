import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useMember } from '@proton/account/member/hook';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { useCalendars } from '@proton/calendar/calendars/hooks';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useOrganization } from '@proton/components/hooks';
import { PASS_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import {
    isOrganizationDuo,
    isOrganizationFamily,
    isOrganizationPassFamily,
} from '@proton/shared/lib/organization/helper';

import { UsagePanel } from '../payments/subscription/panels';
import LeaveFamilyModal from './LeaveFamilyModal';
import SettingsParagraph from './SettingsParagraph';

const FamilyPlanSection = () => {
    const [organization, organisationLoading] = useOrganization();
    const [user, userLoading] = useUser();
    const [calendars, calendarsLoading] = useCalendars();
    const [addresses, addressLoading] = useAddresses();
    const [, memberLoading] = useMember();

    const [leaveFamilyModal, setLeaveFamilyModal, renderLeaveFamilyModal] = useModalState();

    const isLoading =
        !organization || organisationLoading || userLoading || calendarsLoading || addressLoading || memberLoading;

    const isFamilyPlan = isOrganizationFamily(organization);
    const isPassFamilyPlan = isOrganizationPassFamily(organization);
    const isDuoPlan = isOrganizationDuo(organization);

    const content = (() => {
        if (isFamilyPlan) {
            return c('familyOffer_2023:Family plan').t`Leave Family plan`;
        }
        if (isPassFamilyPlan) {
            return c('familyOffer_2023:Family plan').t`Leave ${PASS_SHORT_APP_NAME} Family plan`;
        }
        if (isDuoPlan) {
            return c('familyOffer_2023:Family plan').t`Leave Duo plan`;
        }
        return c('familyOffer_2023:Family plan').t`Leave Visionary plan`;
    })();

    return isLoading ? (
        <Loader />
    ) : (
        <>
            <SettingsParagraph>{c('familyOffer_2023:Family plan')
                .t`You are part of ${organization.Name}.`}</SettingsParagraph>
            <div className="w-full lg:w-1/2 max-w-custom" style={{ '--max-w-custom': '33em' }}>
                <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user}>
                    <Button
                        shape="ghost"
                        color="danger"
                        fullWidth
                        onClick={() => {
                            setLeaveFamilyModal(true);
                        }}
                    >
                        {content}
                    </Button>
                </UsagePanel>
            </div>
            {renderLeaveFamilyModal && <LeaveFamilyModal organisationName={organization.Name} {...leaveFamilyModal} />}
        </>
    );
};

export default FamilyPlanSection;
