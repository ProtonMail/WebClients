import type { PropsWithChildren, ReactElement, ReactNode } from 'react';

import IconRow from '@proton/components/components/iconRow/IconRow';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';

import { BookingLocation } from '../bookingsProvider/interface';

interface FormIconRowProps extends PropsWithChildren {
    title: string;
    hideBorder?: boolean;
    narrowSection?: boolean;
    suffix?: ReactNode;
    icon: ReactElement;
}

export const FormIconRow = ({ title, icon, children, hideBorder = false, suffix }: FormIconRowProps) => {
    let titleNode = <h2 className="text-sm text-semibold mb-2">{title}</h2>;
    if (suffix) {
        titleNode = (
            <div className="flex flex-nowrap items-center justify-space-between">
                <h2 className="text-sm text-semibold mb-2">{title}</h2>
                {suffix}
            </div>
        );
    }

    return (
        <IconRow icon={icon} containerClassName="items-baseline w-full" labelClassName="pt-0.5">
            {titleNode}
            {children}
            {!hideBorder && <hr className="mt-5 mb-1 bg-weak" />}
        </IconRow>
    );
};

interface FormLocationOptionProps {
    value: BookingLocation;
    text: string;
}

export const FormLocationOptionContent = ({ value, text }: FormLocationOptionProps) => {
    let icon: ReactNode = null;
    switch (value) {
        case BookingLocation.MEET:
            icon = <MeetLogo variant="glyph-only" size={4} />;
            break;
        case BookingLocation.IN_PERSON:
            icon = <IcMapPin />;
            break;
    }

    return (
        <span className="flex items-center gap-2">
            {icon}
            {text}
        </span>
    );
};
