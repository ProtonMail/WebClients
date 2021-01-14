import { VcalVtimezoneComponent } from '../calendar';
import { SimpleMap } from '../utils';

export interface VTimezoneObject {
    vtimezone: VcalVtimezoneComponent;
    vtimezoneString: string;
}

export type GetVTimezones = (tzids: string[]) => Promise<SimpleMap<VTimezoneObject>>;
