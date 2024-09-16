import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import './PromotionBanner.scss';

interface Props {
    className?: string;
    rounded?: boolean;
    icon?: ReactNode;
    description?: ReactNode;
    cta?: ReactNode;
    loading?: boolean;
    hasDismissAction?: boolean;
    contentCentered?: boolean;
    mode?: 'row' | 'banner';
    onClose?: () => void;
    ['data-testid']?: string;
}

const PromotionBanner = ({
    className,
    rounded = false,
    loading = false,
    contentCentered = true,
    mode = 'row',
    description,
    cta,
    icon,
    hasDismissAction = false,
    onClose,
    'data-testid': dataTestId,
}: Props) => {
    const handleClose = () => {
        onClose?.();
    };

    return (
        <div
            className={clsx(
                'flex flex-nowrap shrink-0 bg-promotion relative',
                contentCentered && 'text-left lg:text-center p-0-5',
                rounded && 'rounded',
                className
            )}
            data-testid={dataTestId}
        >
            <div
                className={clsx(
                    'inline-flex mx-auto flex-nowrap items-center flex-column md:flex-row gap-2',
                    (() => {
                        if (contentCentered) {
                            return 'm-0.5 px-2';
                        }
                        if (mode === 'banner') {
                            return 'm-3 px-4 w-full';
                        }
                        if (mode === 'row') {
                            return 'm-2 pl-4 w-full';
                        }
                    })(),
                    loading && 'w-1/3'
                )}
            >
                {loading ? (
                    <span
                        className={clsx('bg-promotion-loading', contentCentered ? 'w-full' : 'w-1/3')}
                        data-testid="promotion-banner:loading"
                    />
                ) : (
                    <>
                        {icon && <div className="shrink-0">{icon}</div>}
                        {description && (
                            <div
                                className={clsx(
                                    'bg-promotion-text',
                                    !contentCentered && 'flex-1',
                                    mode === 'banner' && !contentCentered && 'text-center md:text-left'
                                )}
                            >
                                {description}
                            </div>
                        )}
                        {cta && <div className="shrink-0 w-full md:w-auto md:max-w-1/3 text-right">{cta}</div>}
                    </>
                )}
            </div>
            {isTruthy(hasDismissAction && !loading) && (
                <Button
                    onClick={handleClose}
                    icon
                    size="small"
                    color="weak"
                    shape="ghost"
                    className="shrink-0 ml-2 mr-1 my-auto"
                    title={c('Action').t`Close`}
                >
                    <Icon name="cross" alt={c('Action').t`Close`} />
                </Button>
            )}
        </div>
    );
};

export default PromotionBanner;
