import { fetchControllerFactory } from '@proton/pass/lib/api/fetch-controller';

/** Restricts the interception of fetch requests to only those within the service
 * worker's scope. This ensures that only requests originating from the same origin
 * are processed, avoiding interference from requests potentially made by extensions. */
export const fetchController = fetchControllerFactory({
    protocols: ['https:'],
    hostnames: [self.location.hostname],
});
