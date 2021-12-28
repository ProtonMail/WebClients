import { useEffect, useState } from 'react';
import { c } from 'ttag';
import { isMaybeTorLessThan11 } from '@proton/shared/lib/helpers/browser';

import { Href } from '../../components';
import TopBanner from './TopBanner';

const TorWarningBanner = () => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        try {
            setShow(isMaybeTorLessThan11());
        } catch (e) {
            // Ignore
        }
    }, []);

    if (!show) {
        return null;
    }

    const stableRelease = (
        <Href key="link" href="https://www.torproject.org/download/">{c('Tor out of date').t`stable release`}</Href>
    );
    return (
        <TopBanner className="bg-danger">
            {
                // translator: followed by a link "stable release"
                c('Tor out of date')
                    .jt`This version of Tor Browser is not supported. Please update to the latest ${stableRelease}`
            }
        </TopBanner>
    );
};

export default TorWarningBanner;
