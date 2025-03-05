import { useEffect } from 'react';

import { OPEN_COMPOSER_WITH_MAILTO_EVENT } from '@proton/shared/lib/constants';

import { MESSAGE_ACTIONS } from '../constants';
import { useOnCompose, useOnMailTo } from '../containers/ComposeProvider';
import { ComposeTypes } from './composer/useCompose';

/**
 * Interface for the custom event detail
 */
interface OpenComposerEventDetail {
    mailto?: string;
}

/**
 * Hook that listens for a custom event to open the composer with a mailto link
 * This hook can be used to open the composer from anywhere in the application
 * by dispatching a custom event with the mailto link
 *
 * Example usage:
 * ```
 * document.dispatchEvent(
 *   new CustomEvent('open-composer-with-mailto', {
 *     detail: { mailto: 'mailto:example@example.com?subject=Hello&body=World' }
 *   })
 * );
 * ```
 */
const useComposerEvent = () => {
    const onCompose = useOnCompose();
    const onMailTo = useOnMailTo();

    useEffect(() => {
        const handleOpenComposerEvent = (event: Event) => {
            const customEvent = event as CustomEvent<OpenComposerEventDetail>;
            const { detail } = customEvent;

            if (detail?.mailto) {
                // If a mailto link is provided, use the onMailTo handler
                onMailTo(detail.mailto);
            } else {
                // Otherwise, just open a new empty composer
                onCompose({ type: ComposeTypes.newMessage, action: MESSAGE_ACTIONS.NEW });
            }
        };

        // Add event listener for the custom event
        document.addEventListener(OPEN_COMPOSER_WITH_MAILTO_EVENT, handleOpenComposerEvent);

        // Clean up the event listener when the component unmounts
        return () => {
            document.removeEventListener(OPEN_COMPOSER_WITH_MAILTO_EVENT, handleOpenComposerEvent);
        };
    }, [onCompose, onMailTo]);
};

export default useComposerEvent;
