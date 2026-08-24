import { Href } from '@proton/atoms/Href/Href';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import SettingsLink from '../../../../../components/link/SettingsLink';

const ctaClassName = 'shrink-0 text-no-decoration hover:text-underline text-no-wrap text-lg w-full md:w-auto';

interface Props {
    image: string;
    title: string;
    description: string;
    ctaText: string;
    ctaHref: string;
    index: number;
    isSettingsLink?: boolean;
}

export const CallToActionBanner = ({
    image,
    title,
    description,
    ctaText,
    ctaHref,
    index,
    isSettingsLink = false,
}: Props) => {
    return (
        <div className={clsx('flex flex-wrap items-center gap-4 p-6', index !== 0 && 'border-top border-weak')}>
            {image && <img src={image} alt="" width={56} height={56} className="shrink-0" />}
            <div className="flex-1 flex flex-column md:flex-row flex-nowrap gap-2 items-center">
                <div className="flex flex-column flex-nowrap md:flex-1">
                    <p className="text-bold m-0">{title}</p>
                    <p className="color-weak m-0">{description}</p>
                </div>
                {isSettingsLink ? (
                    <SettingsLink app={APPS.PROTONMAIL} path={ctaHref} target="_self" className={ctaClassName}>
                        {ctaText}
                    </SettingsLink>
                ) : (
                    <Href target="_self" href={ctaHref} className={ctaClassName}>
                        {ctaText}
                    </Href>
                )}
            </div>
        </div>
    );
};
