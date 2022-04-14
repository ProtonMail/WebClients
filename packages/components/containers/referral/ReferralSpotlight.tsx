import { c } from 'ttag';
import { Spotlight, SettingsLink } from '@proton/components';
import { APPS, PLANS, PLAN_NAMES } from '@proton/shared/lib/constants';
import starImg from '@proton/styles/assets/img/illustrations/spotlight-stars.svg';

interface Props {
    children: React.ReactElement;
    anchorRef: React.RefObject<HTMLElement>;
    show: boolean;
    onDisplayed: () => void;
    onClose: () => void;
}

const ReferralSpotlight = ({ children, show, onDisplayed, anchorRef }: Props) => {
    const planName = PLAN_NAMES[PLANS.MAIL];

    return (
        <Spotlight
            show={show}
            onDisplayed={onDisplayed}
            style={{ maxWidth: '25rem' }}
            content={
                <>
                    <div className="flex flex-nowrap mt0-5 mb0-5">
                        <div className="flex-item-noshrink mr1">
                            <img src={starImg} alt="star" className="w4e" />
                        </div>
                        <div>
                            <p className="mt0 mb0-5 text-bold">{c('Spotlight').t`Invite friends and earn rewards!`}</p>
                            <p className="m0">{c('Spotlight').t`Get up to 18 months of ${planName} for free`}</p>
                            <SettingsLink path="/referral" app={APPS.PROTONMAIL}>{c('Link')
                                .t`Learn more`}</SettingsLink>
                        </div>
                    </div>
                </>
            }
            anchorRef={anchorRef}
        >
            {children}
        </Spotlight>
    );
};

export default ReferralSpotlight;
