import { c } from 'ttag';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
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

export const getDisplayTitle = (title = '') => {
    return title || c('Event title').t`(no title)`;
};
