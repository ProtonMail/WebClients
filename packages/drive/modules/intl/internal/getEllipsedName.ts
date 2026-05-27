import truncate from '@proton/utils/truncate';

export function getEllipsedName(name: string) {
    return truncate(name, 30);
}
