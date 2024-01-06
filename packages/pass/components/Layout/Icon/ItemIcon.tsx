import type { ReactNode } from 'react';
import { type FC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms/CircleLoader';
import type { IconName, IconSize } from '@proton/components';
import { Icon } from '@proton/components';
import { selectCanLoadDomainImages } from '@proton/pass/store/selectors';
import type { Item, ItemMap, ItemRevision, ItemRevisionWithOptimistic, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { DomainIcon, ImageStatus } from './DomainIcon';
import { IconBox } from './IconBox';

export const itemTypeToIconName: ItemMap<IconName> = {
    login: 'user',
    note: 'file-lines',
    alias: 'alias',
    creditCard: 'credit-card',
};

export const presentItemIcon = (item: Item) => itemTypeToIconName[item.type];

type BaseItemIconProps = {
    alt: string;
    className?: string;
    icon: IconName;
    iconClassName?: string;
    loadImage?: boolean;
    pill?: boolean;
    size: IconSize;
    url?: MaybeNull<string>;
    renderIndicators?: () => ReactNode;
};

export const ItemIcon: FC<BaseItemIconProps> = ({
    alt,
    className,
    icon,
    iconClassName,
    loadImage = true,
    pill,
    size,
    url,
    renderIndicators,
}) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);

    return (
        <IconBox
            className={className}
            mode={url && imageStatus === ImageStatus.READY ? 'image' : 'icon'}
            size={size}
            pill={pill}
        >
            <span className="sr-only">{alt}</span>

            {loadImage && (
                <DomainIcon
                    className={clsx('w-custom h-custom absolute inset-center', iconClassName)}
                    style={{ '--w-custom': `${size}px`, '--h-custom': `${size}px`, '--anime-delay': '0s' }}
                    onStatusChange={handleStatusChange}
                    status={imageStatus}
                    url={url ?? ''}
                />
            )}

            {imageStatus !== ImageStatus.READY && (
                <Icon
                    className={clsx('absolute inset-center', iconClassName)}
                    color="var(--interaction-norm)"
                    name={icon}
                    size={size}
                />
            )}

            {renderIndicators?.()}
        </IconBox>
    );
};

type ItemIconProps<T extends ItemRevision> = {
    className: string;
    item: T;
    pill?: boolean;
    size: IconSize;
    renderIndicators?: () => ReactNode;
};

export const SafeItemIcon: FC<ItemIconProps<ItemRevision>> = ({ className, item, pill, size, renderIndicators }) => {
    const { data } = item;
    const loadDomainImages = useSelector(selectCanLoadDomainImages);
    const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;

    return (
        <ItemIcon
            alt={data.type}
            className={className}
            icon={presentItemIcon(data)}
            loadImage={loadDomainImages}
            pill={pill}
            renderIndicators={renderIndicators}
            size={size}
            url={domainURL}
        />
    );
};

export const OptimisticItemIcon: FC<ItemIconProps<ItemRevisionWithOptimistic>> = (props) => {
    const { optimistic, failed } = props.item;

    const renderIndicators = () => {
        if (failed) {
            return (
                <Icon
                    className="absolute inset-center"
                    color="var(--signal-warning)"
                    name="exclamation-circle-filled"
                    size={props.size}
                />
            );
        }

        if (optimistic) {
            return <CircleLoader size="small" className="z-up color-primary absolute inset-center opacity-60" />;
        }
    };

    return <SafeItemIcon {...props} renderIndicators={renderIndicators} />;
};
