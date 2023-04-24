import { type VFC, useState } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components';
import type { ItemRevisionWithOptimistic } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { presentItemIcon } from '../../../shared/items';
import { ImageStatus, ProxiedDomainImage } from './ProxiedDomainImage';

import './ItemIcon.scss';

export const ItemIcon: VFC<{ item: ItemRevisionWithOptimistic; size: number; className: string }> = ({
    item,
    size,
    className,
}) => {
    const { data, optimistic, failed } = item;
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;
    const imageSize = Math.round(size * 0.6);

    const renderIndicators = () => {
        if (failed) {
            return (
                <Icon
                    className="absolute-center"
                    color="var(--signal-warning)"
                    name="exclamation-circle-filled"
                    size={20}
                />
            );
        }

        if (optimistic) {
            return <CircleLoader size="small" className="upper-layer color-primary absolute-center opacity-60" />;
        }
    };

    const renderIcon = () => {
        if (domainURL && imageStatus !== ImageStatus.ERROR) {
            return (
                <ProxiedDomainImage
                    className={clsx(
                        'w-custom h-custom absolute-center',
                        optimistic && 'opacity-30',
                        failed && 'hidden'
                    )}
                    style={{ '--width-custom': `${imageSize}px`, '--height-custom': `${imageSize}px` }}
                    onStatusChange={setImageStatus}
                    status={imageStatus}
                    url={domainURL}
                />
            );
        }

        return (
            <Icon
                className={clsx('absolute-center', optimistic && 'opacity-30', failed && 'hidden')}
                color="var(--interaction-norm)"
                name={presentItemIcon(data)}
                size={20}
            />
        );
    };

    return (
        <div
            className={clsx(
                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative',
                className,
                domainURL && imageStatus !== ImageStatus.ERROR && 'pass-item-icon--has-image'
            )}
            style={{ '--width-custom': `${size}px`, '--height-custom': `${size}px` }}
        >
            <span className="sr-only">{data.type}</span>
            {renderIcon()}
            {renderIndicators()}
        </div>
    );
};
