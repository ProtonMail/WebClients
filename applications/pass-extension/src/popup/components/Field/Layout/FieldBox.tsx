import { Children, type FC, type ReactElement, cloneElement, isValidElement } from 'react';

import { Icon, type IconName } from '@proton/components';
import type { MaybeArray } from '@proton/pass/types';
import clsx from '@proton/utils/clsx';

import './FieldBox.scss';

export type FieldBoxProps = {
    actions?: MaybeArray<ReactElement>;
    actionsContainerClassName?: string;
    className?: string;
    icon?: IconName | ReactElement;
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

export const FieldBox: FC<FieldBoxProps> = (props) => {
    const { className, actions, actionsContainerClassName, children, icon } = props;
    const isCoreIcon = typeof icon == 'string';
    const iconEl = isCoreIcon ? <Icon name={icon} size={20} /> : icon;

    return (
        <div className={clsx('pass-field-box flex flex-nowrap flex-align-items-start px-4 py-3', className)}>
            {icon && (
                <span
                    className={clsx(
                        'flex flex-justify-center flex-align-items-center flex-item-noshrink pr-4',
                        isCoreIcon && 'mt-2'
                    )}
                    style={{ color: 'var(--fieldset-cluster-icon-color)' }}
                >
                    {iconEl}
                </span>
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
