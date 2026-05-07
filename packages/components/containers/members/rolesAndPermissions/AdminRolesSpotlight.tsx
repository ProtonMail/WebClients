import type { PropsWithChildren } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import type { SpotlightProps } from '@proton/components/components/spotlight/Spotlight';
import Spotlight from '@proton/components/components/spotlight/Spotlight';

interface Props extends Omit<SpotlightProps, 'content' | 'type'> {
    title: string;
    description: string;
    kbLink: string;
}

const AdminRolesSpotlight = ({ title, description, kbLink, children, ...spotlightProps }: PropsWithChildren<Props>) => {
    const content = (
        <>
            <p className="text-bold m-0">{title}</p>
            <p className="m-0">{description}</p>
            <Href href={kbLink}>{c('Link').t`Learn more`}</Href>
        </>
    );

    return (
        <Spotlight {...spotlightProps} type="new" content={content}>
            {children}
        </Spotlight>
    );
};

export default AdminRolesSpotlight;
