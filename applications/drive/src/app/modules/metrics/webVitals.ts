import { reportWebVitals } from '@proton/shared/lib/metrics/webvitals';

/** Call once from each app entrypoint (private / public). */
export function initDriveWebVitalsReporting(isPublic: boolean) {
    reportWebVitals(isPublic ? 'public' : 'private');
}
