import type { FC } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href';

export const HIBPWarning: FC = () => {
    const href = (
        <Href href="https://haveibeenpwned.com/" key="hibp-link">
            HIBP
        </Href>
    );
    return (
        // translation: the variable {href} is a hyperlink, full sentence is: "The custom email will be sent to HIBP for monitoring. No other data will be sent to HIBP."
        c('Info').jt`The custom email will be sent to ${href} for monitoring. No other data will be sent to HIBP.`
    );
};
