import { InjectionMode, contextHandlerFactory, contextInjectorFactory } from './create-shared-context';

interface TestContext {
    value: number;
    getData(id: string): string;
}

describe('`contextHandlerFactory`', () => {
    test('should `set` and `get` a context value', () => {
        const handler = contextHandlerFactory<string>('test-context');
        const value = 'test-value';
        handler.set(value);

        expect(handler.get()).toBe(value);
    });

    test('should throw when trying to `get` uninitialized context', () => {
        const handler = contextHandlerFactory<string>('test-context');
        expect(() => handler.get()).toThrow('Context#test-context has not been initialized');
    });

    test('should return `undefined` when reading uninitialized context', () => {
        const handler = contextHandlerFactory<string>('test-context');
        expect(handler.read()).toBeUndefined();
    });

    test('should `clear` the context', () => {
        const handler = contextHandlerFactory<string>('test-context');
        handler.set('test-value');
        handler.clear();

        expect(handler.read()).toBeUndefined();
        expect(() => handler.get()).toThrow();
    });

    test('should correctly handle object contexts', () => {
        const handler = contextHandlerFactory<TestContext>('test-context');
        const mockMethod = jest.fn().mockReturnValue('result');
        handler.set({ value: 42, getData: mockMethod });

        expect(handler.get().value).toBe(42);
        expect(handler.get().getData('')).toBe('result');
        expect(mockMethod).toHaveBeenCalled();
    });
});

describe('`contextInjectorFactory`', () => {
    let context: ReturnType<typeof contextHandlerFactory<TestContext>>;
    let mockGetData: jest.Mock;

    beforeEach(() => {
        mockGetData = jest.fn((id) => `data-${id}`);
        context = contextHandlerFactory<TestContext>('test-context');
    });

    test('should create "strict" injector that passes context to callback', () => {
        const strictInjector = contextInjectorFactory(context, InjectionMode.STRICT);
        const fn = strictInjector((ctx, param: string) => ctx.getData(param));
        context.set({ getData: mockGetData, value: 42 });

        expect(fn('test-id')).toBe('data-test-id');
        expect(mockGetData).toHaveBeenCalledWith('test-id');
    });

    test('should create "loose" injector that handles uninitialized context', () => {
        const looseInjector = contextInjectorFactory(context, InjectionMode.LOOSE);
        const fn = looseInjector((ctx, param: string) => ctx?.getData(param));

        expect(fn('test-id')).toBeUndefined();
        expect(mockGetData).not.toHaveBeenCalled();
    });

    test('should throw in "strict" mode when context is not initialized', () => {
        const strictInjector = contextInjectorFactory(context, InjectionMode.STRICT);
        const fn = strictInjector((ctx) => ctx.value);

        expect(() => fn()).toThrow('Context#test-context has not been initialized');
    });

    test('should handle functions with multiple arguments', () => {
        const injector = contextInjectorFactory(context, InjectionMode.STRICT);
        const fn = injector((ctx, a: number, b: string, c: boolean) => `${ctx.value}-${a}-${b}-${c}`);
        context.set({ value: 10, getData: mockGetData });

        expect(fn(20, 'test', true)).toBe('10-20-test-true');
    });
});
