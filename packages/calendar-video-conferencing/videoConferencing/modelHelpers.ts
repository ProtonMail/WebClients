import type {
    EventModelReadView,
    VIDEO_CONFERENCE_PROVIDER,
    VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';

const isVcalEvent = (model: EventModelReadView | VcalVeventComponent): model is VcalVeventComponent => {
    return 'component' in model;
};

export const getVideoConferencingData = (model: EventModelReadView | VcalVeventComponent) => {
    if (isVcalEvent(model)) {
        const provider = model?.['x-pm-conference-id']?.parameters?.['x-pm-provider'];

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
        };
    }

    // For EventModelReadView, use the dedicated conference fields first, then fall back to raw rest properties
    return {
        description: model.description.trim(),
        location: model.location.trim(),
        meetingId: model.conferenceId ?? model.rest?.['x-pm-conference-id']?.value,
        meetingUrl: model.conferenceUrl ?? model.rest?.['x-pm-conference-url']?.value,
        password:
            model.conferencePassword ??
            model.rest?.['x-pm-conference-url']?.parameters?.['x-pm-password'] ??
            model.rest?.['x-pm-conference-url']?.parameters?.password,
        meetingHost:
            model.conferenceHost ??
            model.rest?.['x-pm-conference-url']?.parameters?.['x-pm-host'] ??
            model.rest?.['x-pm-conference-url']?.parameters?.host,
        meetingProvider: model.conferenceProvider,
    };
};
