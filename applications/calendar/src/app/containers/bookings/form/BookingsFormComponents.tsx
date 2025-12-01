import type { PropsWithChildren, ReactElement, ReactNode } from 'react';

import IconRow from '@proton/components/components/iconRow/IconRow';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import { IcExclamationCircleFilled } from '@proton/icons/icons/IcExclamationCircleFilled';
import { IcMapPin } from '@proton/icons/icons/IcMapPin';
import clsx from '@proton/utils/clsx';

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
            icon = <MeetLogo variant="glyph-only" />;
            break;
        case BookingLocation.IN_PERSON:
            icon = <IcMapPin />;
            break;
    }

    return (
        <span className="flex items-center gap-2">
            <span className="shrink-0 w-custom ratio-square" style={{ width: '1.25rem' }}>
                {icon}
            </span>
            {text}
        </span>
    );
};

interface FormErrorProps extends PropsWithChildren {
    wrapperClassName?: string;
}

export const FormErrorWrapper = ({ children, wrapperClassName }: FormErrorProps) => {
    return (
        <div className={clsx('flex flex-nowrap color-danger', wrapperClassName)}>
            <IcExclamationCircleFilled className="shrink-0 mr-1" size={4} />
            <span className="text-sm text-semibold">{children}</span>
        </div>
    );
};
