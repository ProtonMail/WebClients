import { memo } from 'react';

import { c } from 'ttag';

import chromeImage from '../assets/images/chrome.svg';
import firefoxImage from '../assets/images/firefox.svg';
import iosImage from '../assets/images/ios.svg';
import playStoreImage from '../assets/images/play-store.svg';
import nonFulfilledStarImage from '../assets/images/star-non-fulfilled.svg';
import starImage from '../assets/images/star.svg';
import swissFlag from '../assets/images/swiss-flag.svg';

const PLATFORM_LOGOS = [iosImage, playStoreImage, chromeImage, firefoxImage];

export const AccountDetailsAside = memo(() => (
    <section
        className="pass-signup-card-glass w-7/10 flex flex-column items-center py-16 px-4 rounded-lg max-w-custom min-w-custom"
        style={{ '--max-w-custom': '35em', '--min-w-custom': '30em' }}
    >
        <h2 className="font-arizona text-4xl text-center">{c('Signup')
            .t`Trusted by over 100 million people and businesses`}</h2>
        <div>
            {Array.from({ length: 4 }).map((_, i) => (
                <img key={`star-icon-${i}`} src={starImage} className="star" alt="Star icon" width={90} height={90} />
            ))}
            <img src={nonFulfilledStarImage} className="star" alt="Star icon" width={90} height={90} />
        </div>
        <h2 className="font-arizona text-4xl text-center mt-custom" style={{ '--mt-custom': `-0.5em` }}>{c('Signup')
            .t`4.8+ rating`}</h2>
        <div className="flex gap-2 mt-8">
            {PLATFORM_LOGOS.map((logo, i) => (
                <div
                    key={`platform-logo-${i}`}
                    className="flex justify-center items-center rounded-lg bg-invert w-custom h-custom"
                    style={{ '--w-custom': '3.5rem', '--h-custom': '3.5rem' }}
                >
                    <img src={logo} alt="Logo Icon" />
                </div>
            ))}
        </div>
        <div className="flex gap-2 mt-12">
            <img src={swissFlag} alt="Swiss flag" />
            <h2 className="font-arizona text-5xl text-center">{c('Signup').t`Swiss-based`}</h2>
        </div>
    </section>
));
