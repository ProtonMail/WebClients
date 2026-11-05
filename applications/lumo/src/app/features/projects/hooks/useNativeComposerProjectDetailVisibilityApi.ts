import { useNativeComposerVisibilityApi } from '../../../components/Composer/hooks/useNativeComposerVisibilityApi';

/** Keep the composer covered until all project-detail modals close, then restore the current layout's visibility. */
export const useNativeComposerProjectDetailVisibilityApi = (shouldHideComposer: boolean): void => {
    useNativeComposerVisibilityApi({ hideComposer: shouldHideComposer });
};
