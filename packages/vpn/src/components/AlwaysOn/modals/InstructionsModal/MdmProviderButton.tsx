import type { ReactNode } from 'react';

import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import { IcArrowOutSquare } from '@proton/icons/icons/IcArrowOutSquare';

interface Props {
    name: ReactNode;
    href: string;
    icon: ReactNode;
}

export const MdmProviderButton = ({ name, href, icon }: Props) => (
    <ButtonLike as={Href} href={href} className="text-sm flex flex-row shrink-0 gap-2 items-center">
        {icon}
        <span>{name}</span>
        <IcArrowOutSquare size={3.5} className="color-weak" />
    </ButtonLike>
);
