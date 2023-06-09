export const arrayRemove = <T>(array: T[], removeAt: number): T[] => array.filter((_, index) => index !== removeAt);
