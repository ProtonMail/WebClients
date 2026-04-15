import truncate from '@proton/utils/truncate';

export const getEllipsedName = (name: string) => truncate(name, 30);
