import { type VFC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import { Icon } from '@proton/components';
import { selectCanLoadDomainImages } from '@proton/pass/store';
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
    const loadDomainImages = useSelector(selectCanLoadDomainImages);
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;
    const imageSize = Math.round(size * 0.6);

    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);

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

    return (
        <div
            className={clsx(
                'pass-item-icon w-custom h-custom rounded-xl overflow-hidden relative',
                className,
                domainURL && imageStatus === ImageStatus.READY && 'pass-item-icon--has-image'
            )}
            style={{ '--width-custom': `${size}px`, '--height-custom': `${size}px` }}
        >
            <span className="sr-only">{data.type}</span>

            {loadDomainImages && (
                <ProxiedDomainImage
                    className={clsx(
                        'w-custom h-custom absolute-center',
                        optimistic && 'opacity-30',
                        failed && 'hidden'
                    )}
                    style={{ '--width-custom': `${imageSize}px`, '--height-custom': `${imageSize}px` }}
                    onStatusChange={handleStatusChange}
                    status={imageStatus}
                    url={domainURL ?? ''}
                />
            )}

            {imageStatus !== ImageStatus.READY && (
                <Icon
                    className={clsx('absolute-center', optimistic && 'opacity-30', failed && 'hidden')}
                    color="var(--interaction-norm)"
                    name={presentItemIcon(data)}
                    size={20}
                />
            )}

            {renderIndicators()}
        </div>
    );
};
