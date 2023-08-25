import { c } from 'ttag';

export const getNumAccessesTooltipMessage = () =>
    c('Info').t`The download count includes both actual downloads and instances when files are previewed.`;
export const getSizeTooltipMessage = () =>
    c('Info')
        .t`The encrypted data is slightly larger due to the overhead of the encryption and signatures, which ensure the security of your data.`;
