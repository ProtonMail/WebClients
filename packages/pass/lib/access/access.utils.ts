export const toShareAccessKey = ({ shareId, itemId }: { shareId: string; itemId?: string }) =>
    itemId ? `${shareId}::${itemId}` : shareId;
