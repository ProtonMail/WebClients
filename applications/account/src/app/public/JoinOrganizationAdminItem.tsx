import { c } from 'ttag';

import { Icon } from '@proton/components';
import { BRAND_NAME } from '@proton/shared/lib/constants';

interface Props {
    adminEmail: string;
    organizationLogoUrl?: string | null;
    organizationName?: string;
}

const JoinOrganizationAdminItem = ({ organizationName, adminEmail, organizationLogoUrl }: Props) => {
    return (
        <div className="text-center">
            <div
                className="mb-6 mx-auto flex rounded items-center ratio-square overflow-hidden w-custom shrink-0 grow-0 relative w-custom h-custom bg-norm-weak color-primary"
                style={{
                    '--w-custom': '3.5rem',
                    '--h-custom': '3.5rem',
                }}
            >
                {organizationLogoUrl ? (
                    <img src={organizationLogoUrl} alt="" className="object-cover w-full h-full" />
                ) : (
                    <span className="m-auto" aria-hidden="true">
                        <Icon name="users" size={8} />
                    </span>
                )}
            </div>
            {organizationName && (
                <div className="h2 text-break text-bold mb-4">{c('sso').t`Join ${organizationName}`}</div>
            )}
            <div className="text-lg">
                <div className="text-bold text-break">{adminEmail}</div>
                <div className="">{c('sso').t`added you to their ${BRAND_NAME} organization`}</div>
            </div>
        </div>
    );
};

export default JoinOrganizationAdminItem;
