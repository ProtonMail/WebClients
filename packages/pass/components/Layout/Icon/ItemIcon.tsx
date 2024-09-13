import type { ReactNode } from 'react';
import { type FC, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { CircleLoader } from '@proton/atoms';
import type { IconName, IconSize } from '@proton/components';
import { Icon } from '@proton/components';
import { selectCanLoadDomainImages } from '@proton/pass/store/selectors';
import type { Item, ItemMap, ItemRevision, MaybeNull } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import { DomainIcon, ImageStatus } from './DomainIcon';
import { IconBox, getIconSizePx } from './IconBox';

export const itemTypeToIconName: ItemMap<IconName> = {
    login: 'user',
    note: 'file-lines',
    alias: 'alias',
    creditCard: 'credit-card',
    identity: 'card-identity',
};

export const presentItemIcon = (item: Item) => itemTypeToIconName[item.type];

type BaseItemIconProps = {
    alt: string;
    className?: string;
    icon: IconName;
    iconClassName?: string;
    loadImage?: boolean;
    normColor?: boolean;
    pill?: boolean;
    size: IconSize;
    url?: MaybeNull<string>;
    renderIndicators?: (size: IconSize) => ReactNode;
};

export const ItemIcon: FC<BaseItemIconProps> = ({
    alt,
    className,
    icon,
    iconClassName,
    loadImage = true,
    normColor = true,
    pill,
    size,
    url,
    renderIndicators,
}) => {
    const [imageStatus, setImageStatus] = useState<ImageStatus>(ImageStatus.LOADING);
    const handleStatusChange = useCallback((status: ImageStatus) => setImageStatus(status), []);
    const ready = imageStatus === ImageStatus.READY;

    return (
        <IconBox
            className={className}
            mode={url && ready ? 'image' : 'icon'}
            size={size}
            pill={pill}
            style={{ '--anime-delay': '0s' }}
        >
            <span className="sr-only">{alt}</span>

            {loadImage && (
                <DomainIcon
                    className={clsx('w-custom h-custom absolute inset-center', iconClassName)}
                    style={{
                        '--w-custom': `${getIconSizePx(size)}px`,
                        '--h-custom': `${getIconSizePx(size)}px`,
                        '--anime-delay': '0s',
                    }}
                    onStatusChange={handleStatusChange}
                    status={imageStatus}
                    url={url ?? ''}
                />
            )}

            <Icon
                className={clsx('absolute inset-center', iconClassName, ready && 'anime-fade-out')}
                color={normColor ? 'var(--interaction-norm)' : ''}
                name={icon}
                size={size}
            />

            {renderIndicators?.(size)}
        </IconBox>
    );
};

type ItemIconProps = {
    className?: string;
    iconClassName?: string;
    item: ItemRevision;
    pill?: boolean;
    size: IconSize;
    renderIndicators?: (size: IconSize) => ReactNode;
};

export const SafeItemIcon: FC<ItemIconProps> = ({ className, iconClassName, item, pill, size, renderIndicators }) => {
    const { data } = item;
    const loadDomainImages = useSelector(selectCanLoadDomainImages);
    const domainURL = data.type === 'login' ? data.content.urls?.[0] : null;

    return (
        <ItemIcon
            alt={data.type}
            className={className}
            icon={presentItemIcon(data)}
            iconClassName={iconClassName}
            loadImage={loadDomainImages}
            pill={pill}
            renderIndicators={(size) => renderIndicators?.(size)}
            size={size}
            url={domainURL}
        />
    );
};

type ItemIconIndicatorsProps = { size: IconSize; loading: boolean; error: boolean };

export const ItemIconIndicators: FC<ItemIconIndicatorsProps> = ({ size, loading, error }) => {
    if (error) {
        return (
            <Icon
                className="absolute inset-center"
                color="var(--signal-warning)"
                name="exclamation-circle-filled"
                size={size}
            />
        );
    }

    if (loading) return <CircleLoader size="small" className="z-up color-primary absolute inset-center opacity-60" />;

    return null;
};
