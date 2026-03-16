import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { IcInfoCircle } from '@proton/icons/icons/IcInfoCircle';
import type { IconSize } from '@proton/icons/types';

import './SettingsNavItem.scss';

interface IconProps {
    className?: string;
    size?: IconSize;
}

type Props =
    | {
          to: string;
          onClick?: never;
          icon: ComponentType<IconProps>;
          title: string;
          tooltip?: ReactNode;
          children?: ReactNode;
      }
    | {
          onClick: () => void;
          to?: never;
          icon: ComponentType<IconProps>;
          title: string;
          tooltip?: ReactNode;
          children?: ReactNode;
      };

const rowClassName =
    'settings-nav-item-grid grid items-center gap-2 md:gap-4 color-norm p-4 interactive-pseudo-inset interactive--no-background relative w-full text-left text-no-decoration';

const SettingsNavItem = (props: Props) => {
    const { icon: Icon, title, tooltip, children } = props;

    const inner = (
        <>
            <div className="shrink-0 color-weak">
                <Icon size={5} />
            </div>
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 lg:gap-2 items-center">
                <div className="block text-semibold w-full inline-flex items-center gap-1 flex-wrap min-w-0">
                    {title}
                    {tooltip != null ? (
                        <Tooltip title={tooltip} originalPlacement="top" openDelay={0}>
                            <span className="inline-flex color-weak shrink-0 transition-opacity group-hover:opacity-100">
                                <IcInfoCircle alt="" size={4} />
                            </span>
                        </Tooltip>
                    ) : null}
                </div>
                <div className="block w-full">{children}</div>
            </div>
        </>
    );

    return (
        <div className="settings-nav-item w-full bg-elevated relative group-hover-opacity-container">
            {'to' in props && props.to !== undefined ? (
                <Link to={props.to} className={rowClassName}>
                    {inner}
                    <IcChevronRight size={5} className="shrink-0 color-disabled ml-auto" />
                </Link>
            ) : (
                <button type="button" className={rowClassName} onClick={props.onClick}>
                    {inner}
                    <span />
                </button>
            )}
        </div>
    );
};

export default SettingsNavItem;
