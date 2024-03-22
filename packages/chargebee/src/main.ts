import { initialize } from './chargebee-entry';
import { addCheckpoint } from './checkpoints';
import { getMessageBus } from './message-bus';

document.addEventListener('DOMContentLoaded', () => initialize());

window.addEventListener('error', (event) => {
    addCheckpoint('window_error', {
        event,
        error: event.error,
    });
    event.preventDefault();
    getMessageBus().sendUnhandledErrorMessage(event.error);
});
