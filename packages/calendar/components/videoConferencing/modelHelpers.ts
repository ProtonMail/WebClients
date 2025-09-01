import type {
    EventModelReadView,
    VIDEO_CONFERENCE_PROVIDER,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';

const isVcalEvent = (model: EventModelReadView | VcalVeventComponent): model is VcalVeventComponent => {
    return 'component' in model;
};

export const getVideoConferencingData = (model: EventModelReadView | VcalVeventComponent) => {
    // The model is a VcalVeventComponent if it has a 'component' property
    if (isVcalEvent(model)) {
        const provider = model?.['x-pm-conference-id']?.parameters?.['x-pm-provider'];
        const encryptedTitle = model?.['x-pm-conference-id']?.parameters?.['x-pm-encrypted-title'];

        return {
            description: model.description?.value.trim(),
            location: model.location?.value.trim(),
            meetingId: model?.['x-pm-conference-id']?.value,
            meetingUrl: model?.['x-pm-conference-url']?.value,
            password:
                model?.['x-pm-conference-url']?.parameters?.['x-pm-password'] ||
                model?.['x-pm-conference-url']?.parameters?.password,
            meetingHost:
                model?.['x-pm-conference-url']?.parameters?.['x-pm-host'] ||
                model?.['x-pm-conference-url']?.parameters?.host,
            meetingProvider: provider ? (Number(provider) as VIDEO_CONFERENCE_PROVIDER) : undefined,
            encryptedTitle: encryptedTitle,
        };
    }

    // We return both the description and location as trimmed strings with the custom fields
    return {
        description: model.description.trim(),
        location: model.location.trim(),
        meetingId: model.rest['x-pm-conference-id']?.value,
        meetingUrl: model.rest['x-pm-conference-url']?.value,
        password:
            model.rest['x-pm-conference-url']?.parameters?.['x-pm-password'] ||
            model.rest['x-pm-conference-url']?.parameters?.password,
        meetingHost:
            model.rest['x-pm-conference-url']?.parameters?.['x-pm-host'] ||
            model.rest['x-pm-conference-url']?.parameters?.host,
    };
};
