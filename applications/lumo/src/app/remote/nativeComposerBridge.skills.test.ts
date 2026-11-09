describe.each(['Android', 'iOS'])('Skills bridge transport: %s', (platform) => {
    const originalUA = navigator.userAgent;
    const setUA = (version: string) =>
        Object.defineProperty(navigator, 'userAgent', {
            configurable: true,
            value: `ProtonLumo/${version} (${platform === 'Android' ? 'Android 16' : 'iOS 26.0'})`,
        });
    let api: any;
    let instance: any;
    let post: jest.Mock;
    let state: jest.Mock;
    beforeEach(() => {
        setUA('2.2.0');
        jest.resetModules();
        post = jest.fn();
        state = jest.fn();
        if (platform === 'Android') (window as any).Android = { postMessage: post, onStateChange: state };
        else {
            (window as any).webkit = {
                messageHandlers: {
                    nativeComposerHandler: { postMessage: post },
                    nativeComposerStateHandler: { postMessage: state },
                },
            };
        }
        require('./nativeComposerBridge');
        api = (window as any).nativeComposerApi;
        instance = (window as any).nativeComposerApiInstance;
        post.mockClear();
        state.mockClear();
    });
    afterEach(() => {
        Object.defineProperty(navigator, 'userAgent', { configurable: true, value: originalUA });
        delete (window as any).Android;
        delete (window as any).webkit;
    });
    const response = () => (platform === 'Android' ? JSON.parse(post.mock.lastCall[0]) : post.mock.lastCall[0]);
    it('advertises unavailable until a composer registers; preserves legacy defaults', () => {
        expect(instance.getState()).toMatchObject({
            skills: { version: 1, status: 'unavailable', commands: [] },
            customLumos: [],
            selectedCustomLumo: null,
        });
        api.invokeSkill('call', { text: 'draft', id: 'x', revision: 'old' });
        expect(response()).toEqual({ callId: 'call', status: 'error', error: 'skills_unavailable' });
    });
    it('returns replacement text in the existing callback envelope without logging it', () => {
        const log = jest.spyOn(console, 'log').mockImplementation(() => {});
        const handler = jest.fn(() => ({ text: '/chart private draft' }));
        instance.registerSkillsHandler(handler);
        const input = { revision: 'r', id: 'x', text: 'private draft' };
        api.invokeSkill('call', input);
        expect(handler).toHaveBeenCalledWith(input);
        expect(response()).toEqual({ callId: 'call', status: 'success', data: { text: '/chart private draft' } });
        expect(JSON.stringify(log.mock.calls)).not.toContain('private draft');
        log.mockRestore();
    });
    it('keeps older clients on Custom Lumos and rejects Skills invocation', () => {
        setUA('2.1.99');
        const handler = jest.fn(() => ({ text: '/chart draft' }));
        instance.registerSkillsHandler(handler);
        instance.setSkills({ version: 1, status: 'ready', revision: 'r', commands: [] });
        expect(instance.getState().skills.status).toBe('unavailable');
        api.invokeSkill('call', { revision: 'r', id: 'x', text: 'draft' });
        expect(response().error).toBe('skills_unavailable');
        expect(handler).not.toHaveBeenCalled();
        instance.setCustomLumos([{ id: 'legacy', name: 'Legacy', source: 'personal' }]);
        expect(instance.getState().customLumos).toHaveLength(1);
    });
    it('hides legacy catalog and selection and rejects legacy actions on Skills clients', async () => {
        instance.setCustomLumos([{ id: 'legacy', name: 'Legacy', source: 'personal' }]);
        instance.setSelectedCustomLumo({ id: 'legacy', name: 'Legacy', source: 'personal' });
        expect(instance.getState()).toMatchObject({ customLumos: [], selectedCustomLumo: null });
        const listener = jest.fn();
        window.addEventListener('lumo:selectCustomLumo', listener);
        await expect(instance.selectCustomLumo('legacy')).rejects.toThrow('custom_lumos_unavailable');
        await expect(instance.clearCustomLumo()).rejects.toThrow('custom_lumos_unavailable');
        expect(listener).not.toHaveBeenCalled();
        window.removeEventListener('lumo:selectCustomLumo', listener);
    });
    it('publishes skills and does not expose web setters to native', () => {
        instance.setSkills({ version: 1, status: 'ready', revision: 'r', commands: [] });
        expect(instance.getState().skills.status).toBe('ready');
        expect(api.setSkills).toBeUndefined();
        expect(api.registerSkillsHandler).toBeUndefined();
        expect(typeof api.selectCustomLumo).toBe('function');
        expect(state).toHaveBeenCalledTimes(1);
    });
    it('rejects invocation during message editing and after handler cleanup', () => {
        const handler = jest.fn(() => ({ text: '/chart draft' }));
        const cleanup = instance.registerSkillsHandler(handler);
        instance.setEditMode('edit');
        api.invokeSkill('call', {});
        expect(response().error).toBe('skills_unavailable');
        expect(handler).not.toHaveBeenCalled();
        instance.clearEditMode();
        cleanup();
        api.invokeSkill('call', {});
        expect(response().error).toBe('skills_unavailable');
    });
});
