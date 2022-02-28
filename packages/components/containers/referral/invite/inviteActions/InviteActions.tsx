import { useState } from 'react';
import { c } from 'ttag';
import { classnames, Button } from '@proton/components';

import InviteHowItWorks from './InviteHowItWorks';
import ReferralSignatureToggle from './ReferralSignatureToggle';

const InviteActions = () => {
    const [showHowItWorksSection, setShowHowItWorksSection] = useState(false);
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
            <InviteHowItWorks show={showHowItWorksSection} handleClose={() => setShowHowItWorksSection(false)} />
        </>
    );
};

export default InviteActions;
