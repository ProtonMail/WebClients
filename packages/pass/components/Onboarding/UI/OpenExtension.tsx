import { c } from 'ttag';

import PassLogo from '@proton/components/components/logo/PassLogo';

import { Card } from './Card';
import arrow from './arrow.png';

import './OpenExtension.scss';

export const OpenExtension = () => {
    return (
        <div className="pass-onboarding-open-extension fixed">
            <Card className="pass-onboarding-open-extension-card absolute inline-flex items-center text-lg font-semibold">
                <PassLogo variant="glyph-only" />
                {c('Info').t`Open the extension here.`}
            </Card>
            <img src={arrow} alt="" />
        </div>
    );
};
