import { c } from 'ttag';

import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import upsellScheduleIcon from '@proton/styles/assets/img/meet/upsell-schedule-icon.svg';

import type { CTAModalBaseProps } from '../shared/types';
import { UpsellModalShell } from './UpsellModalShell';

export const ScheduleUpsellModal = ({ open, onClose, action }: CTAModalBaseProps) => {
    return (
        <UpsellModalShell
            open={open}
            onClose={onClose}
            action={action}
            icon={
                <img
                    className="w-custom h-custom"
                    src={upsellScheduleIcon}
                    alt=""
                    style={{ '--w-custom': '4rem', '--h-custom': '4rem' }}
                />
            }
            title={c('Info').t`You are almost there`}
            subtitle={getBoldFormattedText(
                c('Info')
                    .t`To schedule an event, you'll need **a free ${BRAND_NAME} Account** so we can save the event. This only takes a few seconds.`,
                'color-white'
            )}
        />
    );
};
