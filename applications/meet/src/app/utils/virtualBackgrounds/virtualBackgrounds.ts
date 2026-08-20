import { c } from 'ttag';

export const VIRTUAL_BACKGROUNDS = [
    { id: 'purple', color: '#968aef' },
    { id: 'blue', color: '#00bbff' },
    { id: 'green', color: '#51cc52' },
    { id: 'orange', color: '#ff9761' },
] as const;

export type VirtualBackgroundId = (typeof VIRTUAL_BACKGROUNDS)[number]['id'];

export type BackgroundEffect = 'none' | 'blur' | VirtualBackgroundId;

export const isVirtualBackgroundId = (value: unknown): value is VirtualBackgroundId =>
    VIRTUAL_BACKGROUNDS.some((background) => background.id === value);

export const getVirtualBackgroundColor = (id: VirtualBackgroundId) =>
    VIRTUAL_BACKGROUNDS.find((background) => background.id === id)?.color;

export const getVirtualBackgroundLabel = (id: VirtualBackgroundId) => {
    switch (id) {
        case 'purple':
            return c('Label').t`Purple background`;
        case 'blue':
            return c('Label').t`Blue background`;
        case 'green':
            return c('Label').t`Green background`;
        case 'orange':
            return c('Label').t`Orange background`;
    }
};
