import type { VFC } from 'react';
import { useCallback, useState } from 'react';

import { c } from 'ttag';

import type { IconName } from '@proton/components/components';
import { Icon } from '@proton/components/components';
import type { MaybeNull } from '@proton/pass/types';
import { PassIcon } from '@proton/pass/types/data/pass-icon';
import type { DropdownIcon } from '@proton/pass/types/data/pass-icon';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { ImageStatus, ProxiedDomainImage } from '../../../../../popup/components/Item/ProxiedDomainImage';

import '../../../../../popup/components/Item/ItemIcon.scss';

export const DropdownItemIcon: VFC<{
    icon?: DropdownIcon;
    url?: string;
    canLoadFavicons?: boolean;
    className?: string;
}> = ({ icon, url, canLoadFavicons, className }) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);
    const iconFullSize = 36;
    const faviconSize = Math.round(iconFullSize * 0.6);
    const resolvePassIconAsset = (icon: DropdownIcon): MaybeNull<string> =>
        Object.values<DropdownIcon>(PassIcon).includes(icon) ? `/assets/${icon}.svg` : null;

    return (
        <>
            {(() => {
                if (url) {
                    return (
                        <div
                            className={clsx(
                                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative',
                                className,
                                url && imageStatus === ImageStatus.READY && 'pass-item-icon--has-image'
                            )}
                            style={{ '--width-custom': `${iconFullSize}px`, '--height-custom': `${iconFullSize}px` }}
                        >
                            {canLoadFavicons && (
                                <ProxiedDomainImage
                                    className={clsx(
                                        'absolute-center w-custom h-custom',
                                        imageStatus !== ImageStatus.READY && 'hidden'
                                    )}
                                    style={{
                                        '--width-custom': `${faviconSize}px`,
                                        '--height-custom': `${faviconSize}px`,
                                    }}
                                    onStatusChange={handleStatusChange}
                                    status={imageStatus}
                                    url={url ?? ''}
                                />
                            )}
                            {!canLoadFavicons ||
                                (imageStatus !== ImageStatus.READY && (
                                    <Icon
                                        className="absolute-center"
                                        color="var(--interaction-norm)"
                                        name="user"
                                        size={20}
                                    />
                                ))}
                        </div>
                    );
                } else if (icon) {
                    const passIconAsset = resolvePassIconAsset(icon);
                    return passIconAsset ? (
                        <div
                            className={clsx('w-custom text-align-center', className)}
                            style={{ '--width-custom': `${iconFullSize}px` }}
                        >
                            <img
                                src={passIconAsset}
                                width={iconFullSize}
                                height={iconFullSize}
                                className="ml-1"
                                alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                            />
                        </div>
                    ) : (
                        <div
                            className={clsx(
                                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative',
                                className
                            )}
                            style={{ '--width-custom': `${iconFullSize}px`, '--height-custom': `${iconFullSize}px` }}
                        >
                            <Icon
                                className="absolute-center"
                                name={icon as IconName}
                                size={20}
                                color="var(--interaction-norm)"
                            />
                        </div>
                    );
                } else {
                    return (
                        <div
                            className={clsx('w-custom text-align-center', className)}
                            style={{ '--width-custom': `${iconFullSize}px` }}
                        >
                            <img
                                src={resolvePassIconAsset(PassIcon.ACTIVE) as string}
                                width={iconFullSize}
                                height={iconFullSize}
                                className="ml-1"
                                alt={c('Action').t`Toggle ${PASS_APP_NAME}`}
                            />
                        </div>
                    );
                }
            })()}
        </>
    );
};
