import type { ReactNode } from 'react';
import { Provider } from 'react-redux';

import { configureStore } from '@reduxjs/toolkit';
import { renderHook } from '@testing-library/react-hooks';

import { EASY_SWITCH_SOURCES, ImportProvider, ImportType } from '../../../interface';
import { startOauthDraft } from '../../../logic/draft/oauthDraft/oauthDraft.actions';
import oauthDraft from '../../../logic/draft/oauthDraft/oauthDraft.slice';
import { DEFAULT_OAUTH_MODAL_VIEWS, type OAuthModalViewsOverride, useOAuthModalViews } from './OAuthModalViews';
import StepSuccess from './StepSuccess/StepSuccess';

const DriveStepSuccess = () => null;

const getWrapper = (provider: ImportProvider, products: ImportType[]) =>
    function Wrapper({ children }: { children: ReactNode }) {
        const store = configureStore({ reducer: { oauthDraft } });
        store.dispatch(startOauthDraft({ provider, products, source: EASY_SWITCH_SOURCES.UNKNOWN }));

        return <Provider store={store}>{children}</Provider>;
    };

describe('useOAuthModalViews', () => {
    it('returns the default views when no override is provided', () => {
        const { result } = renderHook(() => useOAuthModalViews(), {
            wrapper: getWrapper(ImportProvider.GOOGLE, [ImportType.MAIL]),
        });

        expect(result.current).toBe(DEFAULT_OAUTH_MODAL_VIEWS);
    });

    it('returns the default views when the override does not match the current draft', () => {
        const override: OAuthModalViewsOverride = {
            matches: (draft) => draft.products?.length === 1 && draft.products[0] === ImportType.DRIVE,
            views: { Success: DriveStepSuccess },
        };
        const { result } = renderHook(() => useOAuthModalViews(override), {
            wrapper: getWrapper(ImportProvider.GOOGLE, [ImportType.MAIL]),
        });

        expect(result.current.Success).toBe(StepSuccess);
    });

    it('merges in the override views when the override matches the current draft', () => {
        const override: OAuthModalViewsOverride = {
            matches: (draft) => draft.products?.length === 1 && draft.products[0] === ImportType.DRIVE,
            views: { Success: DriveStepSuccess },
        };
        const { result } = renderHook(() => useOAuthModalViews(override), {
            wrapper: getWrapper(ImportProvider.GOOGLE, [ImportType.DRIVE]),
        });

        expect(result.current.Success).toBe(DriveStepSuccess);
        expect(result.current.Prepare).toBe(DEFAULT_OAUTH_MODAL_VIEWS.Prepare);
    });
});
