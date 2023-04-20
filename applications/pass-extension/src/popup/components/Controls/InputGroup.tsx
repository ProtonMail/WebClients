import {
    Children,
    type FC,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    cloneElement,
    isValidElement,
} from 'react';

import type { MaybeArray } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './InputGroup.scss';

export type Props = {
    actions?: MaybeArray<ReactElement>;
    actionsContainerClassName?: string;
    actionsStopPropagation?: boolean;
    icon?: ReactNode;
    className?: string;
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

export const BaseInputGroup: FC<Props> = ({ className, actions, actionsContainerClassName, children, icon }) => {
    return (
        <div className={clsx('flex flex-nowrap flex-align-items-center pass-input-group', className)}>
            {icon && (
                <span className="flex flex-justify-center flex-align-items-center flex-item-noshrink pr-4">{icon}</span>
            )}

            <div className="w100">{children}</div>

            {actions && (
                <span className={clsx('flex-item-noshrink ml-3', actionsContainerClassName)}>
                    {stopOnClickPropagation(actions)}
                </span>
            )}
        </div>
    );
};

export const InputGroup: FC<Props> = (props) => {
    return <BaseInputGroup {...props} className={clsx(props.className, 'px-4 py-3')} />;
};
