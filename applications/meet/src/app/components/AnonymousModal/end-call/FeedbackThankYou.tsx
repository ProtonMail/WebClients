import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import upsellModalIcon from '@proton/styles/assets/img/meet/upsell-modal-icon.svg';

import { CTAModalShell } from '../shared/CTAModalShell';

interface FeedbackThankYouProps {
    open: boolean;
    onClose: () => void;
}

export const FeedbackThankYou = ({ open, onClose }: FeedbackThankYouProps) => (
    <CTAModalShell
        open={open}
        onClose={onClose}
        icon={
            <img
                src={upsellModalIcon}
                alt=""
                className="w-custom h-custom"
                style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
            />
        }
        title={c('Title').t`Thank you!`}
        subtitle={c('Title').t`Your feedback has been submitted`}
        headerClassName="pt-10"
        titleClassName="text-semibold"
        actions={
            <Button
                className="back-dashboard-button rounded-full py-4 text-semibold px-10"
                onClick={onClose}
                size="medium"
            >
                {c('Label').t`Back to dashboard`}
            </Button>
        }
    />
);
