import {
    VcalCalendarComponent,
    VcalVeventComponent,
    VcalVfreebusyComponent,
    VcalVjournalComponent,
    VcalVtimezoneComponent,
    VcalVtodoComponent,
} from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { EventPersonalMap } from '../interfaces/EventPersonalMap';

interface GetComponentArguments {
    component: VcalVeventComponent;
    personalMap: EventPersonalMap;
    memberID: string;
}

export const getComponentWithPersonalPart = ({ component, personalMap = {}, memberID }: GetComponentArguments) => {
    const { components: valarmComponents = [] } = personalMap[memberID] || {};
    return {
        ...component,
        components: valarmComponents,
    };
};

export const getIsEventComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVeventComponent => {
    return vcalComponent.component.toLowerCase() === 'vevent';
};

export const getIsTodoComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVtodoComponent => {
    return vcalComponent.component.toLowerCase() === 'vtodo';
};

export const getIsJournalComponent = (vcalComponent: VcalCalendarComponent): vcalComponent is VcalVjournalComponent => {
    return vcalComponent.component.toLowerCase() === 'vjournal';
};

export const getIsFreebusyComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVfreebusyComponent => {
    return vcalComponent.component.toLowerCase() === 'vfreebusy';
};

export const getIsTimezoneComponent = (
    vcalComponent: VcalCalendarComponent
): vcalComponent is VcalVtimezoneComponent => {
    return vcalComponent.component.toLowerCase() === 'vtimezone';
};
