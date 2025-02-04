import CustomDeselected from '@proton/styles/assets/img/shared-servers/custom-deselected.svg';
import CustomSelected from '@proton/styles/assets/img/shared-servers/custom-selected.svg';
import OnDeselected from '@proton/styles/assets/img/shared-servers/off-deselected.svg';
import OffDeselected from '@proton/styles/assets/img/shared-servers/off-deselected.svg';
import OffSelected from '@proton/styles/assets/img/shared-servers/off-selected.svg';
import OnSelected from '@proton/styles/assets/img/shared-servers/on-selected.svg';

interface Illustration {
    selected: string;
    deselected: string;
}

interface Illustrations {
    On: Illustration;
    Off: Illustration;
    Custom: Illustration;
}

const illustrations: Illustrations = {
    On: {
        selected: OnSelected as string,
        deselected: OnDeselected as string,
    },
    Off: {
        selected: OffSelected as string,
        deselected: OffDeselected as string,
    },
    Custom: {
        selected: CustomSelected as string,
        deselected: CustomDeselected as string,
    },
};

function isValidLabel(label: string): label is keyof Illustrations {
    return label in illustrations;
}

export { isValidLabel, illustrations };
