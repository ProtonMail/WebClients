import { reportWebVitals } from '@proton/metrics/webvitals';

/** Call once from each app entrypoint (private / public). */
export function initDriveWebVitalsReporting(isPublic: boolean) {
    reportWebVitals(isPublic ? 'public' : 'private');
}
