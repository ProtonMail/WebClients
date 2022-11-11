import { RequireSome } from '../interfaces';
import { CalendarCreateEventBlobData } from '../interfaces/calendar';

export const getHasSharedEventContent = (
    data: Partial<CalendarCreateEventBlobData>
): data is RequireSome<CalendarCreateEventBlobData, 'SharedEventContent'> => !!data.SharedEventContent;

export const getHasSharedKeyPacket = (
    data: CalendarCreateEventBlobData
): data is RequireSome<CalendarCreateEventBlobData, 'SharedKeyPacket'> => !!data.SharedKeyPacket;
