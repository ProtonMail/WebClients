import { LABEL_TYPE } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces/Label';

export const buildLabel = (value?: Partial<Label>): Label => {
    return {
        ID: 'label-id',
        Name: 'Label',
        Color: '#c44800',
        ContextTime: undefined,
        Type: LABEL_TYPE.MESSAGE_LABEL,
        Order: 1,
        Path: 'Label',
        Display: 1,
        Notify: 0,
        LastUnseenMessageEventID: null,
        ...value,
    };
};
