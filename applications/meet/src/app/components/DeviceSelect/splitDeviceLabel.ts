const TRAILING_GROUP = /\s*\([^()]*\)$/;
const MAX_TRAILING_GROUP_LENGTH = 12;
const FALLBACK_END_LENGTH = 6;

interface SplitDeviceLabel {
    start: string;
    end: string;
}

export const splitDeviceLabel = (label: string): SplitDeviceLabel => {
    const trailingGroup = TRAILING_GROUP.exec(label);
    if (trailingGroup && trailingGroup.index > 0 && [...trailingGroup[0]].length <= MAX_TRAILING_GROUP_LENGTH) {
        return { start: label.slice(0, trailingGroup.index), end: trailingGroup[0] };
    }

    const characters = [...label];
    if (characters.length <= FALLBACK_END_LENGTH) {
        return { start: label, end: '' };
    }

    return {
        start: characters.slice(0, -FALLBACK_END_LENGTH).join(''),
        end: characters.slice(-FALLBACK_END_LENGTH).join(''),
    };
};
