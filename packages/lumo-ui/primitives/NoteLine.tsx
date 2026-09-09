import type { ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

/**
 * A quiet line of consequence or scale under a confirm card's sentence. Not a warning — nothing a card
 * proposes is destructive — but where the scope is larger than the body can show, it has to be said.
 */
const NoteLine = ({ children }: Props) => <span className="lumo-note-line text-sm">{children}</span>;

export default NoteLine;
