import { CalendarDisplay } from './Calendar';

export interface CalendarMember {
    ID: string;
    Email: string;
    Permissions: number;
    AddressID: string;
    Flags: number;
    Color: string;
    Display: CalendarDisplay;
    CalendarID: string;
}
