import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { DashboardGrid, DashboardGridSectionHeader } from '@proton/atoms/DashboardGrid/DashboardGrid';
import { Href } from '@proton/atoms/Href/Href';
import useBYOEFeatureStatus from '@proton/byoe/src/hooks/useBYOEFeatureStatus';
import Loader from '@proton/components/components/loader/Loader';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { BRAND_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';

import Addresses from './Addresses';

interface Props {
    isOnlySelf?: boolean;
}

const AddressesSection = ({ isOnlySelf }: Props) => {
    const [organization, loadingOrganization] = useOrganization();
    const [hasAccessToBYOE] = useBYOEFeatureStatus();

    return (
        <DashboardGrid as="div">
            <DashboardGridSectionHeader
                title={c('Title').t`My addresses`}
                subtitle={
                    <>
                        {c('Info')
                            .t`Use multiple email addresses with ${MAIL_APP_NAME}. Add a new ${BRAND_NAME} address or connect another email account to manage everything from one inbox.`}{' '}
                        <Href href={getKnowledgeBaseUrl('/addresses-and-aliases')}>{c('Link').t`Learn more`}</Href>
                    </>
                }
            />
            {!organization || loadingOrganization ? (
                <Loader />
            ) : (
                <Addresses
                    isOnlySelf={isOnlySelf}
                    organization={organization}
                    hasAccessToBYOE={hasAccessToBYOE}
                    hasDescription={false}
                    variant={SettingsLayoutVariant.Card}
                />
            )}
        </DashboardGrid>
    );
};

export default AddressesSection;
