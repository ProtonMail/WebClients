import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { useModalState } from '@proton/components/components';
import { Loader } from '@proton/components/components/loader';
import { useAddresses, useCalendars, useOrganization, useUser } from '@proton/components/hooks';
import { isOrganizationFamily } from '@proton/shared/lib/organization/helper';

import { UsagePanel } from '../payments/subscription/panels';
import LeaveFamilyModal from './LeaveFamilyModal';
import SettingsParagraph from './SettingsParagraph';

const FamilyPlanSection = () => {
    const [organization, organisationLoading] = useOrganization();
    const [user, userLoading] = useUser();
    const [calendars, calendarsLoading] = useCalendars();
    const [addresses, addressLoading] = useAddresses();

    const [leaveFamilyModal, setLeaveFamilyModal, renderLeaveFamilyModal] = useModalState();

    const isLoading = organisationLoading || userLoading || calendarsLoading || addressLoading;

    const isFamilyPlan = isOrganizationFamily(organization);

    return isLoading ? (
        <Loader />
    ) : (
        <>
            <SettingsParagraph>{c('familyOffer_2023:Family plan')
                .t`You are part of ${organization.Name}.`}</SettingsParagraph>
            <div className="w50 on-tablet-w100">
                <UsagePanel addresses={addresses} calendars={calendars} organization={organization} user={user}>
                    <Button
                        shape="ghost"
                        color="danger"
                        fullWidth
                        onClick={() => {
                            setLeaveFamilyModal(true);
                        }}
                    >
                        {isFamilyPlan
                            ? c('familyOffer_2023:Family plan').t`Leave family plan`
                            : c('familyOffer_2023:Family plan').t`Leave visionary plan`}
                    </Button>
                </UsagePanel>
            </div>
            {renderLeaveFamilyModal && <LeaveFamilyModal organisationName={organization.Name} {...leaveFamilyModal} />}
        </>
    );
};

export default FamilyPlanSection;
