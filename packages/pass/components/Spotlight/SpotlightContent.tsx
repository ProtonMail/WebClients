import { type ComponentType, type ElementType, type FC, type MouseEvent, type ReactNode, useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Icon } from '@proton/components';
import { useSpotlight } from '@proton/pass/components/Spotlight/SpotlightProvider';
import { SpotlightMessage } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';
import clsx from '@proton/utils/clsx';

import './SpotlightContent.scss';

export type BaseSpotlightMessage = {
    className?: string;
    hidden?: boolean;
    id: string;
    type: SpotlightMessage;
    weak?: boolean;
    onClose?: () => void;
};

export type DefaultSplotlightMessage = BaseSpotlightMessage & {
    mode: 'default';
    action?: { label: string; onClick: (e: MouseEvent<HTMLElement>) => void; type: 'link' | 'button' };
    dense?: boolean;
    icon?: ElementType;
    message: ReactNode;
    title: ReactNode;
};

export type CustomSplotlightMessage = BaseSpotlightMessage & {
    mode: 'custom';
    component: ComponentType<BaseSpotlightMessage>;
};

export type SpotlightMessageDefinition = DefaultSplotlightMessage | CustomSplotlightMessage;

export const SpotlightContent: FC<SpotlightMessageDefinition> = (props) => {
    const { acknowledge } = useSpotlight();

    const onClose = useCallback(() => {
        if (props.type !== SpotlightMessage.NOOP) acknowledge(props.type);
        props.onClose?.();
    }, [props]);

    return (
        <div
            className={clsx(
                props.className,
                props.mode === 'default' && props.weak && 'weak',
                `pass-spotlight-content flex items-center gap-4 p-4 pr-6 rounded relative mt-2`
            )}
        >
            <Button
                icon
                pill
                shape="ghost"
                color="weak"
                size="small"
                className="absolute top-0 right-0"
                onClick={onClose}
            >
                <Icon name="cross-circle-filled" color="var(--interaction-norm-contrast)" alt={c('Action').t`Close`} />
            </Button>

            {(() => {
                switch (props.mode) {
                    case 'custom': {
                        const { component, ...rest } = props;
                        const Component = component;
                        return <Component {...rest} onClose={onClose} />;
                    }

                    case 'default': {
                        const { action, dense, icon: CustomIcon, message, title, weak } = props;

                        const actionNode = (() => {
                            switch (action?.type) {
                                case 'link':
                                    return (
                                        <button
                                            onClick={pipe(action.onClick, onClose)}
                                            className="unstyled text-sm color-invert px-3"
                                        >
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
                                            onClick={pipe(action.onClick, onClose)}
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
