import { requestActionsFactory } from '@proton/pass/store/request/flow';

type IntentDTO = { value: number };
type FailureDTO = { ok: false };
type SuccessDTO = { ok: true };

const testActionFactory = requestActionsFactory<IntentDTO, SuccessDTO, FailureDTO>('action::test');

describe('`requestActionsFactory`', () => {
    describe('`requestID` generation', () => {
        test('should generate correct `requestID` using namespace when no key provided', () => {
            const action = testActionFactory({});
            expect(action.requestID()).toEqual('action::test');
            expect(action.intent({ value: 42 }).meta.request.id).toEqual('action::test');
        });

        test('should generate correct `requestID` using key function when provided', () => {
            const action = testActionFactory({ key: ({ value }) => value.toString() });
            expect(action.requestID({ value: 42 })).toEqual('action::test::42');
            expect(action.intent({ value: 42 }).meta.request.id).toEqual('action::test::42');
        });
    });

    describe('intent action creator', () => {
        test('should create intent action with default prepare', () => {
            const action = testActionFactory();
            const intent = action.intent({ value: 42 });
            expect(intent.payload).toStrictEqual({ value: 42 });
        });

        test('should create intent action with custom prepare', () => {
            const extra = Math.random();
            const prepare = (payload: IntentDTO) => ({ payload: { ...payload, extra } });
            const action = testActionFactory({ intent: { prepare } });
            const intent = action.intent({ value: 42 });
            expect(intent.payload).toStrictEqual({ value: 42, extra });
        });

        test('should default to `config.data = false`', () => {
            const action = testActionFactory();
            const intent = action.intent({ value: 42 });
            expect(intent.meta.request.data).toEqual(false);
            expect(intent.meta.request.id).toEqual('action::test');
            expect(intent.meta.request.status).toEqual('start');
        });

        test('should include request data when `config.data` is true', () => {
            const action = testActionFactory({ intent: { config: { data: true } } });
            const intent = action.intent({ value: 42 });
            expect(intent.meta.request.data).toEqual(true);
            expect(intent.meta.request.id).toEqual('action::test');
            expect(intent.meta.request.status).toEqual('start');
        });

        test('should handle `ActionCallback` parameter correctly', () => {
            const action = testActionFactory();
            const callback = jest.fn();
            const intent = action.intent({ value: 42 }, callback);
            intent.meta.callback?.(action.success(intent.meta.request.id, { ok: true }));

            expect(callback).toHaveBeenCalled();
        });
    });

    describe('success action creator', () => {
        const requestID = Math.random().toString();

        test('should create success action with default prepare', () => {
            const action = testActionFactory();
            const success = action.success(requestID, { ok: true });
            expect(success.payload).toStrictEqual({ ok: true });
        });

        test('should create success action with custom prepare', () => {
            const extra = Math.random();
            const prepare = (payload: SuccessDTO) => ({ payload: { ...payload, extra } });
            const action = testActionFactory({ success: { prepare } });
            const success = action.success(requestID, { ok: true });
            expect(success.payload).toStrictEqual({ ok: true, extra });
        });

        test('should default to `config.data = false`', () => {
            const action = testActionFactory();
            const success = action.success(requestID, { ok: true });
            expect(success.meta.request.data).toEqual(false);
            expect(success.meta.request.id).toEqual(requestID);
            expect(success.meta.request.status).toEqual('success');
        });

        test('should include request data when `config.data` is true', () => {
            const action = testActionFactory({ success: { config: { data: true } } });
            const success = action.success(requestID, { ok: true });
            expect(success.meta.request.data).toEqual(true);
            expect(success.meta.request.id).toEqual(requestID);
            expect(success.meta.request.status).toEqual('success');
        });
    });

    describe('failure action creator', () => {
        const requestID = Math.random().toString();
        const error = new Error('test');

        test('should create failure action with default prepare', () => {
            const action = testActionFactory();
            const failure = action.failure(requestID, error, { ok: false });
            expect(failure.payload).toStrictEqual({ ok: false });
        });

        test('should create failure action with custom prepare', () => {
            const extra = Math.random();
            const prepare = (error: unknown, payload: FailureDTO) => ({ payload: { ...payload, extra }, error });
            const action = testActionFactory({ failure: { prepare } });
            const failure = action.failure(requestID, error, { ok: false });
            expect(failure.payload).toStrictEqual({ ok: false, extra });
            expect(failure.error).toEqual(error);
        });

        test('should default to `config.data = false`', () => {
            const action = testActionFactory();
            const failure = action.failure(requestID, error, { ok: false });
            expect(failure.meta.request.data).toEqual(false);
            expect(failure.meta.request.id).toEqual(requestID);
            expect(failure.meta.request.status).toEqual('failure');
        });

        test('should include request data when `config.data` is true', () => {
            const action = testActionFactory({ failure: { config: { data: true } } });
            const failure = action.failure(requestID, error, { ok: false });
            expect(failure.meta.request.data).toEqual(true);
            expect(failure.meta.request.id).toEqual(requestID);
            expect(failure.meta.request.status).toEqual('failure');
        });
    });
});
