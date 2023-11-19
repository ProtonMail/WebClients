import type { ReactNode } from 'react';
import { type VFC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { IconName, IconSize } from '@proton/components';
import { Icon } from '@proton/components';
import { selectCanLoadDomainImages } from '@proton/pass/store/selectors';
import type { Item, ItemMap, ItemRevisionWithOptimistic, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { IconBox } from './IconBox';
import { ImageStatus, ProxiedDomainImage } from './ProxiedDomainImage';

export const itemTypeToIconName: ItemMap<IconName> = {
    login: 'user',
    note: 'file-lines',
    alias: 'alias',
    creditCard: 'credit-card',
};

export const presentItemIcon = (item: Item) => itemTypeToIconName[item.type];

type BaseItemIconProps = {
    icon: IconName;
    url?: MaybeNull<string>;
    size: IconSize;
    loadImage?: boolean;
    alt: string;
    className?: string;
    iconClassName?: string;
    renderIndicators?: () => ReactNode;
};

type ItemIconProps = { item: ItemRevisionWithOptimistic; size: IconSize; className: string };

export const BaseItemIcon: VFC<BaseItemIconProps> = ({
    icon,
    url,
    size,
    loadImage = true,
    alt,
    className,
    iconClassName,
    renderIndicators,
}) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);

    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);

    return (
        <IconBox size={size} className={className} mode={url && imageStatus === ImageStatus.READY ? 'image' : 'icon'}>
            <span className="sr-only">{alt}</span>

            {loadImage && (
                <ProxiedDomainImage
                    className={clsx('w-custom h-custom absolute-center', iconClassName)}
                    style={{ '--w-custom': `${size}px`, '--h-custom': `${size}px` }}
                    onStatusChange={handleStatusChange}
                    status={imageStatus}
                    url={url ?? ''}
                />
            )}

            {imageStatus !== ImageStatus.READY && (
                <Icon
                    className={clsx('absolute-center', iconClassName)}
                    color="var(--interaction-norm)"
                    name={icon}
                    size={size}
                />
            )}

            {renderIndicators?.()}
        </IconBox>
    );
};

export const ItemIcon: VFC<ItemIconProps> = ({ item, size, className }) => {
    const { data, optimistic, failed } = item;
    const loadDomainImages = useSelector(selectCanLoadDomainImages);
    const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;

    const renderIndicators = () => {
        if (failed) {
            return (
                <Icon
                    className="absolute-center"
                    color="var(--signal-warning)"
                    name="exclamation-circle-filled"
                    size={size}
                />
            );
        }

        if (optimistic) {
            return <CircleLoader size="small" className="upper-layer color-primary absolute-center opacity-60" />;
        }
    };

    return (
        <BaseItemIcon
            icon={presentItemIcon(data)}
            url={domainURL}
            size={size}
            alt={data.type}
            className={className}
            iconClassName={clsx(optimistic && 'opacity-30', failed && 'hidden')}
            renderIndicators={renderIndicators}
            loadImage={loadDomainImages}
        />
    );
};
