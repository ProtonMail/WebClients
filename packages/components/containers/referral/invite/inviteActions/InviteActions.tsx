import { c } from 'ttag';
import { useEffect, useState } from 'react';
import { classnames, Button, useFeature, FeatureCode } from '@proton/components';

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
    }, [isOpen]);

    return (
        <>
            <div className={classnames(['flex flex-justify-space-between', showHowItWorksSection && 'mb2'])}>
                <ReferralSignatureToggle />
                {!showHowItWorksSection && (
                    <div className="flex-item-fluid text-right">
                        <Button
                            className="p0"
                            shape="underline"
                            color="norm"
                            onClick={() => {
                                setShowHowItWorksSection(true);
                            }}
                        >
                            {c('Title').t`How does it work?`}
                        </Button>
                    </div>
                )}
            </div>
            {showHowItWorksSection && <InviteHowItWorks handleClose={handleCloseSection} />}
        </>
    );
};

export default InviteActions;
