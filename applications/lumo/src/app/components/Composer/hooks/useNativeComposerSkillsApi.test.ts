import { act, renderHook } from '@testing-library/react';

import { useSkills } from '../../../features/skills/useSkills';
import useComposerInput from '../../../hooks/useComposerInput';
import { useLumoFlags } from '../../../hooks/useLumoFlags';
import { useLumoStore } from '../../../redux/hooks';
import '../../../remote/nativeComposerBridge';
import { useNativeComposerPromptApi } from './useNativeComposerPromptApi';
import { useNativeComposerSkillsApi } from './useNativeComposerSkillsApi';

jest.mock('../../../features/skills/useSkills');
jest.mock('../../../hooks/useLumoFlags');
jest.mock('../../../redux/hooks');

const initialSkill = { id: 'draft', name: 'draft', description: '', instructions: 'Write a draft', enabled: true };

describe('composer Skills integration without a mounted editor', () => {
    const originalUA = navigator.userAgent;
    afterEach(() => Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUA }));
    const api = (window as any).nativeComposerApiInstance;
    let state: any;
    let listeners: Set<() => void>;
    beforeEach(() => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, value: 'ProtonLumo/2.2.0 (Android 16)' });
        state = { user: { value: { ID: 'account' } }, skills: { status: 'ready', skills: { draft: initialSkill } } };
        listeners = new Set();
        (useLumoStore as jest.Mock).mockReturnValue({
            getState: () => state,
            subscribe: (listener: () => void) => {
                listeners.add(listener);
                return () => listeners.delete(listener);
            },
        });
        (useSkills as jest.Mock).mockReturnValue({ status: 'ready', skills: [initialSkill] });
        (useLumoFlags as jest.Mock).mockReturnValue({ customAgents: true, externalTools: true });
    });
    const mount = () =>
        renderHook(
            ({ account, context, enabled }) => {
                const input = useComposerInput({ onSubmitCallback: jest.fn() });
                useNativeComposerSkillsApi({ accountId: account, context, enabled, setDraft: input.setValue });
                return input;
            },
            { initialProps: { account: 'account', context: 'conversation', enabled: true } }
        );
    const request = () => ({ revision: api.getState().skills.revision, id: 'draft', text: 'native-only text' });
    const notify = () => act(() => listeners.forEach((listener) => listener()));

    it('loads Skills and updates real composer state from native text without dispatching a pending handle', () => {
        const { result, unmount } = mount();
        expect(useSkills).toHaveBeenCalledWith({ enabled: true });
        let response: any;
        act(() => {
            response = api.invokeSkill(request());
        });
        expect(response).toEqual({ text: '/draft native-only text' });
        expect(result.current.value).toBe(response.text);
        unmount();
        expect(listeners.size).toBe(0);
        expect(api.getState().skills.status).toBe('unavailable');
    });
    it('publishes store changes and rejects disabled skills synchronously', () => {
        const { unmount } = mount();
        const old = request();
        state.skills = { ...state.skills, skills: { draft: { ...initialSkill, enabled: false } } };
        expect(() => api.invokeSkill(old)).toThrow('skills_stale');
        notify();
        expect(api.getState().skills.commands).toEqual([]);
        unmount();
    });
    it('publishes new roots and plugin sub-skills after a catalog refresh', () => {
        const { unmount } = mount();
        const oldRevision = api.getState().skills.revision;
        state.skills = {
            status: 'ready',
            skills: {
                draft: initialSkill,
                review: { ...initialSkill, id: 'review', name: 'code-review' },
                plugin: {
                    ...initialSkill,
                    id: 'plugin',
                    name: 'Analysis',
                    instructions: '',
                    plugin: {},
                    subSkills: [
                        { name: 'chart', path: 'skills/chart', description: 'Charts', enabled: true },
                        { name: 'hidden', path: 'skills/hidden', description: '', enabled: false },
                    ],
                },
            },
        };
        notify();
        expect(api.getState().skills.commands.map(({ handle }: { handle: string }) => handle)).toEqual([
            'code-review',
            'draft',
            'chart',
        ]);
        expect(api.getState().skills.revision).not.toBe(oldRevision);
        unmount();
    });

    it('invalidates selection on composer and account changes', () => {
        const { rerender, unmount } = mount();
        const old = request();
        rerender({ account: 'account', context: 'other conversation', enabled: true });
        expect(() => api.invokeSkill(old)).toThrow('skills_stale');
        state.user.value = { ID: 'other account' };
        notify();
        expect(api.getState().skills.status).toBe('unavailable');
        unmount();
    });
    it('clears availability while editing and restores it afterwards', () => {
        const { unmount } = mount();
        const old = request();
        act(() => api.setEditMode('edit text'));
        expect(api.getState().skills.status).toBe('unavailable');
        act(() => api.clearEditMode());
        expect(api.getState().skills.status).toBe('ready');
        expect(() => api.invokeSkill(old)).toThrow('skills_stale');
        unmount();
    });
    it.each(['ProtonLumo/2.1.5 (Android 16)', 'ProtonLumo/2.1.2 (iOS 26.0)'])(
        'does not load/expose Skills on %s',
        (ua) => {
            Object.defineProperty(navigator, 'userAgent', { configurable: true, value: ua });
            const { unmount } = mount();
            expect(useSkills).toHaveBeenLastCalledWith({ enabled: false });
            expect(api.getState().skills.status).toBe('unavailable');
            unmount();
        }
    );
    it('does not expose Skills when disabled', () => {
        const { rerender, unmount } = mount();
        rerender({ account: 'account', context: 'conversation', enabled: false });
        expect(api.getState().skills).toMatchObject({ status: 'unavailable', commands: [] });
        unmount();
    });
    it('sends the applied draft through the existing native send callback', async () => {
        const send = jest.fn();
        const composer = mount();
        const prompt = renderHook(() => useNativeComposerPromptApi(send, jest.fn()));
        let text = '';
        act(() => {
            text = api.invokeSkill(request()).text;
        });
        await act(async () => api.sendPrompt(text));
        expect(send).toHaveBeenCalledWith('/draft native-only text', false);
        prompt.unmount();
        composer.unmount();
    });
});
