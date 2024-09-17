/* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */
import {
    Children,
    type ForwardRefRenderFunction,
    type MouseEventHandler,
    type ReactElement,
    type ReactNode,
    cloneElement,
    forwardRef,
    isValidElement,
} from 'react';

import { Icon, type IconName } from '@proton/components';
import type { MaybeArray } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './FieldBox.scss';

export type FieldBoxProps = {
    actions?: MaybeArray<ReactElement>;
    actionsContainerClassName?: string;
    children?: ReactNode | undefined;
    className?: string;
    icon?: IconName | ReactElement;
    unstyled?: boolean;
    onClick?: MouseEventHandler;
};

const stopOnClickPropagation = (nodes: MaybeArray<ReactElement>): MaybeArray<ReactElement> =>
    Children.map(nodes, (node: ReactElement, index) => {
        const props = node.props as any;

        return isValidElement(node)
            ? cloneElement<any>(node, {
                  key: node.key || index,
                  ...(props?.onClick
                      ? {
                            onClick: (e: MouseEvent) => {
                                e.stopPropagation();
                                props?.onClick?.(e);
                            },
                        }
                      : {}),
                  children: props?.children ? stopOnClickPropagation(props?.children) : undefined,
              })
            : node;
    });

const FieldBoxRender: ForwardRefRenderFunction<HTMLDivElement, FieldBoxProps> = (props, ref) => {
    const { className, actions, actionsContainerClassName, children, icon } = props;
    const isCoreIcon = typeof icon == 'string';
    const iconEl = isCoreIcon ? <Icon name={icon} size={4} /> : icon;

    return (
        <div
            className={clsx('pass-field-box flex flex-nowrap items-start', !props.unstyled && 'px-4 py-3', className)}
            ref={ref}
            onClick={props.onClick}
        >
            {icon && (
                <span
                    className={clsx('flex justify-center items-center shrink-0 pr-4', isCoreIcon && 'mt-2')}
                    style={{ color: 'var(--fieldset-cluster-icon-color)' }}
                >
                    {iconEl}
                </span>
            )}

            <div className="w-full">{children}</div>

            {actions && (
                <span className={clsx('shrink-0 ml-3', actionsContainerClassName)}>
                    {stopOnClickPropagation(actions)}
                </span>
            )}
        </div>
    );
};

export const FieldBox = forwardRef(FieldBoxRender);
