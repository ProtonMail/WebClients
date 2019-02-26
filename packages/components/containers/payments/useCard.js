import { useState } from 'react';

const useCard = ({ method, card: initialCard }) => {
    const [card, updateCard] = useState(toCard(method) || initialCard || DEFAULT_CARD);

    return {
        card,
        updateCard
    };
};

export default useCard;