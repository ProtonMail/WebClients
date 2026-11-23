import type { ReactNode } from 'react';

import lumoCustomizeIcon from '@proton/styles/assets/img/lumo/lumo-customize-icon.svg';

import { type IconName, LumoIcon } from '../../../components/LumoIcon/LumoIcon';
import lumoAppIcon from './lumo-app-icon.png';

import './CustomizeNotice.scss';

interface CustomizeNoticeProps {
    /** `desktop` shows the desktop app icon, for notices about the desktop app. */
    icon?: 'lumo' | 'desktop';
    title: string;
    description: string;
    points: { icon: IconName; text: string }[];
    actions: ReactNode;
    footnote?: string;
}

/** Centered card with the Lumo icon, used where a Customize tab can't show its content yet. */
export const CustomizeNotice = ({
    icon = 'lumo',
    title,
    description,
    points,
    actions,
    footnote,
}: CustomizeNoticeProps) => (
    <div
        className="customize-notice flex flex-column flex-nowrap items-center gap-4 p-10 border lumo-border radius-16 text-center lumo-bg-panel-elevated"
        role="note"
    >
        {icon === 'desktop' ? (
            <img className="customize-notice__app-icon" src={lumoAppIcon} alt="" width={88} height={88} />
        ) : (
            <img className="customize-notice__icon radius-16" src={lumoCustomizeIcon} alt="" width={72} height={72} />
        )}
        <h2 className="customize-notice__title mt-4 lumo-headline-small">{title}</h2>
        <p className="customize-notice__description m-0 lumo-body-large lumo-color-glyph-mid">{description}</p>
        <ul className="customize-notice__points flex flex-column flex-nowrap gap-2 m-0 px-0 py-2 lumo-body-medium text-left list-none">
            {points.map((point) => (
                <li key={point.text} className="flex flex-nowrap items-center gap-2">
                    <LumoIcon
                        aria-hidden
                        name={point.icon}
                        size={16}
                        strokeWidth={1.4}
                        className="shrink-0 lumo-color-glyph-brand-text"
                    />
                    <span>{point.text}</span>
                </li>
            ))}
        </ul>
        <div className="flex flex-wrap justify-center gap-2 pt-2">{actions}</div>
        {footnote && <p className="m-0 lumo-body-small lumo-color-glyph-mid">{footnote}</p>}
    </div>
);
