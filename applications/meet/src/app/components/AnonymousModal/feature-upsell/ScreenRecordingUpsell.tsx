import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import IcCircleRadioFilled from '@proton/styles/assets/img/meet/ic-circle-radio-filled.svg';

import { CTAModalShell } from '../shared/CTAModalShell';
import type { CTAModalBaseProps } from '../shared/types';

export const ScreenRecordingUpsell = ({ open, onClose, action }: CTAModalBaseProps) => {
    return (
        <CTAModalShell
            open={open}
            onClose={onClose}
            icon={
                <img
                    src={IcCircleRadioFilled}
                    alt=""
                    className="w-custom h-custom"
                    style={{ '--w-custom': '4.5em', '--h-custom': '4.5em' }}
                />
            }
            title={c('Info').t`Record your meetings`}
            subtitle={c('Info').t`Upgrade to record your meetings locally.`}
            headerClassName="upsell-modal pt-6 meet-glow-effect relative"
            titleClassName="upsell-modal-title font-arizona"
            actions={
                <Button
                    className="rounded-full px-10 py-4 text-semibold primary w-full upsell-modal-button"
                    onClick={action}
                >
                    {c('Action').t`Upgrade`}
                </Button>
            }
        />
    );
};
