import { EventModelView } from '../interfaces/EventModel';

export const getIsInvitation = ({ organizer }: EventModelView, author?: string) => {
    if (!author || !organizer.email) {
        return false;
    }
    return organizer.email !== author;
};
