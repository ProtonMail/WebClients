import type { ComponentType, ElementType, FC, MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import clsx from '@proton/utils/clsx';

import './SpotlightContent.scss';

export type BaseSpotlightMessage = {
    className?: string;
    hidden?: boolean;
    id: string;
    weak?: boolean;
    onClose?: () => void;
};

export type DefaultSplotlightMessage = BaseSpotlightMessage & {
    type: 'default';
    action?: { label: string; onClick: (e: MouseEvent<HTMLElement>) => void; type: 'link' | 'button' };
    dense?: boolean;
    icon?: ElementType;
    message: ReactNode;
    title: ReactNode;
};

export type CustomSplotlightMessage = BaseSpotlightMessage & {
    type: 'custom';
    component: ComponentType<BaseSpotlightMessage>;
};

export type SpotlightMessageDefinition = DefaultSplotlightMessage | CustomSplotlightMessage;

type Props = SpotlightMessageDefinition;

export const SpotlightContent: FC<Props> = (props) => {
    return (
        <div
            className={clsx(
                props.className,
                props.type === 'default' && props.weak && 'weak',
                `pass-spotlight-content flex items-center gap-4 p-4 pr-6 rounded relative mt-2`
            )}
        >
            {props.onClose && (
                <Button
                    icon
                    pill
                    shape="ghost"
                    color="weak"
                    size="small"
                    className="absolute top-0 right-0"
                    onClick={props.onClose}
                >
                    <Icon
                        name="cross-circle-filled"
                        color="var(--interaction-norm-contrast)"
                        alt={c('Action').t`Close`}
                    />
                </Button>
            )}

            {(() => {
                switch (props.type) {
                    case 'custom': {
                        const { component, ...rest } = props;
                        const Component = component;
                        return <Component {...rest} />;
                    }

                    case 'default': {
                        const { action, dense, icon: CustomIcon, message, title, weak } = props;

                        const actionNode = (() => {
                            switch (action?.type) {
                                case 'link':
                                    return (
                                        <button onClick={action.onClick} className="unstyled text-sm color-invert px-3">
                                            <span className="text-underline">{action.label}</span>
                                        </button>
                                    );
                                case 'button':
                                    return (
                                        <Button
                                            pill
                                            shape="solid"
                                            color="norm"
                                            size="small"
                                            className="text-sm px-3"
                                            onClick={action.onClick}
                                            style={{ backgroundColor: 'var(--interaction-norm-major-3)' }}
                                        >
                                            {action.label}
                                        </Button>
                                    );
                            }
                        })();

                        return (
                            <>
                                <div className="flex-1">
                                    <strong className={clsx('block', !weak && 'color-invert')}>{title}</strong>
                                    <span className={clsx('block text-sm', !weak && 'color-invert')}>{message}</span>
                                    {!dense && <div className="mt-2">{actionNode}</div>}
                                </div>

                                {CustomIcon && (
                                    <div {...(dense ? { style: { order: -1 } } : { className: 'mr-2' })}>
                                        <CustomIcon />
                                    </div>
                                )}

                                {dense && actionNode}
                            </>
                        );
                    }
                }
            })()}
        </div>
    );
};
