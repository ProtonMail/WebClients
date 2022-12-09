import { RequireSome } from '../interfaces';
import { CalendarCreateEventBlobData, CalendarEvent } from '../interfaces/calendar';

export const getHasSharedEventContent = (
    data: Partial<CalendarCreateEventBlobData>
): data is RequireSome<CalendarCreateEventBlobData, 'SharedEventContent'> => !!data.SharedEventContent;

export const getHasSharedKeyPacket = (
    data: CalendarCreateEventBlobData
): data is RequireSome<CalendarCreateEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;

export const getIsAutoAddedInvite = (
    event: CalendarEvent
): event is CalendarEvent & { AddressKeyPacket: string; AddressID: string } =>
    !!event.AddressKeyPacket && !!event.AddressID;
