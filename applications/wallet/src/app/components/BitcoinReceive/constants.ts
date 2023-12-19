import { LightningUriFormat } from '../../types';

export const getLightningFormatOptions: () => { name: string; value: LightningUriFormat }[] = () => [
    { name: 'Unified', value: LightningUriFormat.UNIFIED },
    { name: 'Onchain', value: LightningUriFormat.ONCHAIN },
    { name: 'Lightning', value: LightningUriFormat.LIGHTNING },
];
