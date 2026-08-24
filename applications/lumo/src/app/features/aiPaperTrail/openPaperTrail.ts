import { LUMO_ROUTES } from '../../entrypoint/lumoRoutes';
import { setNativeComposerVisibility } from '../../remote/nativeComposerBridgeHelpers';

/**
 * Enters the paper trail from inside the app. Composer visibility is native state that survives
 * the page load, so hide it before navigating — otherwise it hovers over the app for as long as
 * the fetch takes.
 *
 * It does come back once the new document runs: the bridge announces its default state, which
 * says visible, and stays that way until the paper trail mounts and hides it again. Fixing that
 * means teaching the bridge's initial state about the route.
 */
export const openPaperTrail = (): void => {
    setNativeComposerVisibility(false);
    window.location.assign(LUMO_ROUTES.AI_PAPER_TRAIL);
};
