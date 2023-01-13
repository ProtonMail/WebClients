import { RequireSome } from '../interfaces';
import { CalendarCreateOrUpdateEventBlobData, CalendarEvent } from '../interfaces/calendar';

export const getHasSharedEventContent = (
    data: CalendarCreateOrUpdateEventBlobData
): data is RequireSome<CalendarCreateOrUpdateEventBlobData, 'SharedEventContent'> => !!data.SharedEventContent;

export const getHasSharedKeyPacket = (
    data: CalendarCreateOrUpdateEventBlobData
): data is RequireSome<CalendarCreateOrUpdateEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

export const getHasDefaultNotifications = ({ Notifications }: CalendarEvent) => {
    return !Notifications;
};

export const getIsAutoAddedInvite = (
    event: CalendarEvent
): event is CalendarEvent & { AddressKeyPacket: string; AddressID: string } =>
    !!event.AddressKeyPacket && !!event.AddressID;
