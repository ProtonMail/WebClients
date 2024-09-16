import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { InlineLinkButton } from '@proton/atoms';
import { FeatureCode, useFeature } from '@proton/components';
import clsx from '@proton/utils/clsx';

import InviteHowItWorks from './InviteHowItWorks';
import ReferralSignatureToggle from './ReferralSignatureToggle';

const InviteActions = () => {
    const isOpen = useFeature<boolean>(FeatureCode.ReferralExplanationOpened);
    const [showHowItWorksSection, setShowHowItWorksSection] = useState<boolean | null>(false);

    const handleCloseSection = () => {
        setShowHowItWorksSection(false);

        if (isOpen.feature?.Value === true) {
            void isOpen.update(false);
        }
    };

    useEffect(() => {
        const featureValue = isOpen.feature?.Value;

        if (isOpen.loading === false && featureValue !== undefined && featureValue !== null) {
            setShowHowItWorksSection(!!featureValue);
        }
    }, [isOpen.loading, isOpen.feature?.Value]);

    return (
        <>
            <div className={clsx(['flex justify-space-between items-center', showHowItWorksSection && 'mb-8'])}>
                <ReferralSignatureToggle />
                {!showHowItWorksSection && (
                    <div className="ml-auto pl-4">
                        <InlineLinkButton
                            onClick={() => {
                                setShowHowItWorksSection(true);
                            }}
                        >
                            {c('Title').t`How does it work?`}
                        </InlineLinkButton>
                    </div>
                )}
            </div>
            {showHowItWorksSection && <InviteHowItWorks handleClose={handleCloseSection} />}
        </>
    );
};

export default InviteActions;
