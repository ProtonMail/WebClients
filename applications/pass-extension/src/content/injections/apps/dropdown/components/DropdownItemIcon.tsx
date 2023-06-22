import { type VFC, useCallback, useState } from 'react';

import { c } from 'ttag';

import { Icon, type IconName } from '@proton/components/components';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { PassIcon } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ImageStatus, ProxiedDomainImage } from '../../../../../shared/components/icon/ProxiedDomainImage';

import '../../../../../shared/components/icon/ItemIcon.scss';

export const ICON_OUTER_SIZE = 36;
export const ICON_INNER_SIZE = 20;

export type DropdownItemprops = { url: string; icon: IconName } | { url?: never; icon: DropdownIcon };
type DropdownItemIconDomainProps = { url: string; icon: IconName };
type DropdownItemIconSVGProps = { icon: DropdownIcon };

export const DropdownItemIconDomain: VFC<DropdownItemIconDomainProps> = ({ url, icon }) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);

    return (
        <div
            className={clsx(
                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative mr-3',
                url && imageStatus === ImageStatus.READY && 'pass-item-icon--has-image'
            )}
            style={{ '--w-custom': `${ICON_OUTER_SIZE}px`, '--h-custom': `${ICON_OUTER_SIZE}px` }}
        >
            <ProxiedDomainImage
                className={clsx('absolute-center w-custom h-custom', imageStatus !== ImageStatus.READY && 'hidden')}
                style={{
                    '--w-custom': `${ICON_INNER_SIZE}px`,
                    '--h-custom': `${ICON_INNER_SIZE}px`,
                }}
                onStatusChange={handleStatusChange}
                status={imageStatus}
                url={url ?? ''}
            />
            {imageStatus !== ImageStatus.READY && (
                <Icon className="absolute-center" color="var(--interaction-norm)" name={icon} size={ICON_INNER_SIZE} />
            )}
        </div>
    );
};

export const DropdownItemIconSVG: VFC<DropdownItemIconSVGProps> = ({ icon }) => {
    const asset = Object.values<DropdownIcon>(PassIcon).includes(icon) ? `/assets/${icon}.svg` : null;

    return asset ? (
        <div
            className="w-custom h-custom text-align-center mr-3"
            style={{ '--w-custom': `${ICON_OUTER_SIZE}px`, '--h-custom': `${ICON_OUTER_SIZE}px` }}
        >
            <img
                src={asset}
                width={ICON_OUTER_SIZE}
                height={ICON_OUTER_SIZE}
                className="p-1"
                alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
            />
        </div>
    ) : (
        <div
            className="pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative mr-3"
            style={{ '--w-custom': `${ICON_OUTER_SIZE}px`, '--h-custom': `${ICON_OUTER_SIZE}px` }}
        >
            <Icon
                className="absolute-center"
                name={icon as IconName}
                size={ICON_INNER_SIZE}
                color="var(--interaction-norm)"
            />
        </div>
    );
};

export const DropdownItemIcon: VFC<DropdownItemprops> = ({ url, icon }) =>
    url ? <DropdownItemIconDomain url={url} icon={icon} /> : <DropdownItemIconSVG icon={icon} />;
