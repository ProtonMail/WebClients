import { type VFC, useState } from 'react';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components';
import type { ItemRevisionWithOptimistic } from '@proton/pass/types';

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

    const renderIcon = () => {
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

        const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;

        if (domainURL && imageStatus !== ImageStatus.ERROR) {
            return (
                <ProxiedDomainImage
                    className="w-custom h-custom absolute-center"
                    onStatusChange={setImageStatus}
                    status={imageStatus}
                    url={domainURL}
                />
            );
        }

        return (
            <Icon className="absolute-center" color="var(--interaction-norm)" name={presentItemIcon(data)} size={20} />
        );
    };

    return (
        <div
            className={`pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative ${className}`}
            style={{ '--width-custom': `${size}px`, '--height-custom': `${size}px` }}
        >
            <span className="sr-only">{data.type}</span>
            {renderIcon()}
        </div>
    );
};
