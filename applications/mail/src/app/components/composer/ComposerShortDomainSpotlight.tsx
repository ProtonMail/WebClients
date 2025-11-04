import { useMemo, useState } from 'react';

import { c } from 'ttag';

import { Spotlight, useSpotlightShow } from '@proton/components';
import useMailShortDomainPostSubscriptionComposerSpotlight from '@proton/components/hooks/mail/useMailShortDomainPostSubscriptionSpotlight';
import spotlightImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactNode;
}

const ComposerShortDomainSpotlight = ({ children }: Props) => {
    const [manualClose, setManualClose] = useState(false);
    const shortDomainSpotlight = useMailShortDomainPostSubscriptionComposerSpotlight();
    const canDisplaySpotlight = useMemo(() => {
        if (shortDomainSpotlight.loading) {
            return false;
        }
        return shortDomainSpotlight.canDisplay;
        // eslint-disable-next-line react-hooks/exhaustive-deps -- autofix-eslint-A18492
    }, [shortDomainSpotlight.loading]);

    const show = useSpotlightShow(canDisplaySpotlight) && !manualClose;

    return (
        <Spotlight
            show={show}
            onClose={() => {
                setManualClose(true);
            }}
            onDisplayed={() => {
                void shortDomainSpotlight.setViewed();
            }}
            originalPlacement="left-start"
            size="large"
            availablePlacements={['left-start', 'bottom-start', 'top-start']}
            content={
                // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
                <div
                    className="inline-flex flex-nowrap w-custom"
                    style={{ '--w-custom': '18rem' }}
                    // To avoid closing the spotlight when clicking on the content
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <div className="shrink-0 mr-4">
                        <img src={spotlightImg} alt="" style={{ '--w-custom': '2.75rem' }} />
                    </div>
                    <div className="text-break">
                        <p className="mt-0 mb-1 text-bold">{c('Spotlight').t`Your pm.me email is active`}</p>
                        <p className="m-0">{c('Spotlight')
                            .t`This is now your default address. Open the dropdown to send from a different address. `}</p>
                    </div>
                </div>
            }
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
                // Added extra div here to close Spotlight when click on children
                onClick={() => {
                    if (shortDomainSpotlight.canDisplay) {
                        setManualClose(true);
                    }
                }}
            >
                {children}
            </div>
        </Spotlight>
    );
};

export default ComposerShortDomainSpotlight;
