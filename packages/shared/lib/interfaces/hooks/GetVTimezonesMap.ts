import type { VcalVtimezoneComponent } from '../calendar';
import type { SimpleMap } from '../utils';

export interface VTimezoneObject {
    vtimezone: VcalVtimezoneComponent;
    vtimezoneString: string;
}

export type GetVTimezonesMap = (tzids: string[]) => Promise<SimpleMap<VTimezoneObject>>;
