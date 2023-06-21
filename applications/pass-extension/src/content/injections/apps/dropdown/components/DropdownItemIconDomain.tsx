import type { VFC } from 'react';
import { useCallback, useState } from 'react';

import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import { ImageStatus, ProxiedDomainImage } from '../../../../../shared/components/icon/ProxiedDomainImage';

import '../../../../../popup/components/Item/ItemIcon.scss';

export const DropdownItemIconDomain: VFC<{
    url: string;
    icon: IconName;
    size?: number;
    className?: string;
}> = ({ url, icon, size = 36, className }) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);
    const faviconSize = Math.round(size * 0.6);

    return (
        <div
            className={clsx(
                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative',
                className,
                url && imageStatus === ImageStatus.READY && 'pass-item-icon--has-image'
            )}
            style={{ '--w-custom': `${size}px`, '--h-custom': `${size}px` }}
        >
            <ProxiedDomainImage
                className={clsx('absolute-center w-custom h-custom', imageStatus !== ImageStatus.READY && 'hidden')}
                style={{
                    '--w-custom': `${faviconSize}px`,
                    '--h-custom': `${faviconSize}px`,
                }}
                onStatusChange={handleStatusChange}
                status={imageStatus}
                url={url ?? ''}
            />
            {imageStatus !== ImageStatus.READY && (
                <Icon className="absolute-center" color="var(--interaction-norm)" name={icon} size={20} />
            )}
        </div>
    );
};
