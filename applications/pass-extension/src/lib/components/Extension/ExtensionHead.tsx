import type { FC17 } from 'react';
import { Helmet } from 'react-helmet';

export const ExtensionHead: FC17<{ title: string }> = ({ title }) => {
    return (
        <Helmet>
            <link rel="icon" href={'/assets/protonpass-icon.svg'} type="image/svg+xml" />
            <title>{title}</title>
        </Helmet>
    );
};
