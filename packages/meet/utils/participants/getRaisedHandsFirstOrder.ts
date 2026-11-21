export const getRaisedHandsFirstOrder = ({ order, raisedHands }: { order: string[]; raisedHands: string[] }) => {
    const identitiesInOrder = new Set(order);
    const raisedHandsInOrder = raisedHands.filter((identity) => identitiesInOrder.has(identity));
    const raisedHandsSet = new Set(raisedHandsInOrder);

    return [...raisedHandsInOrder, ...order.filter((identity) => !raisedHandsSet.has(identity))];
};
