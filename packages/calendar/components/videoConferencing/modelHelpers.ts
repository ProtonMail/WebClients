import type { EventModelReadView, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';

export const getVideoConferencingData = (model: EventModelReadView | VcalVeventComponent) => {
    // The model is a VcalVeventComponent if it has a 'component' property
    if ('component' in model) {
        return {
            description: (model as VcalVeventComponent).description?.value.trim(),
            location: (model as VcalVeventComponent).location?.value.trim(),
            meetingId: (model as VcalVeventComponent)?.['x-pm-conference-id']?.value,
            meetingUrl: (model as VcalVeventComponent)?.['x-pm-conference-url']?.value,
            password: (model as VcalVeventComponent)?.['x-pm-conference-url']?.parameters?.password,
            meetingHost: (model as VcalVeventComponent)?.['x-pm-conference-url']?.parameters?.host,
        };
    }

    // We return both the description and location as trimmed strings with the custom fields
    return {
        description: (model as EventModelReadView).description.trim(),
        location: (model as EventModelReadView).location.trim(),
        meetingId: (model as EventModelReadView).rest['x-pm-conference-id']?.value,
        meetingUrl: (model as EventModelReadView).rest['x-pm-conference-url']?.value,
        password: (model as EventModelReadView).rest['x-pm-conference-url']?.parameters?.password,
        meetingHost: (model as EventModelReadView).rest['x-pm-conference-url']?.parameters?.host,
    };
};
