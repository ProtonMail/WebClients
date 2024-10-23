import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

interface Props {
    adminEmail: string;
    organizationLogoUrl?: string | null;
    className?: string;
}

const OrganizationAdminItem = ({ className, adminEmail, organizationLogoUrl }: Props) => {
    return (
        <div className={clsx('flex items-center w-full text-left rounded relative', className)}>
            <div
                className="flex rounded ratio-square overflow-hidden w-custom shrink-0 grow-0 relative  w-custom h-custom bg-weak"
                style={{
                    '--w-custom': '2.25rem',
                    '--h-custom': '2.25rem',
                }}
            >
                {organizationLogoUrl ? (
                    <img src={organizationLogoUrl} alt="" className="object-cover w-full h-full" />
                ) : (
                    <span className="m-auto text-semibold" aria-hidden="true">
                        <Icon name="user" />
                    </span>
                )}
            </div>
            {adminEmail && (
                <div className="mx-3 flex-1">
                    <div className="text-left text-break text-semibold">{adminEmail}</div>
                </div>
            )}
        </div>
    );
};

export default OrganizationAdminItem;
