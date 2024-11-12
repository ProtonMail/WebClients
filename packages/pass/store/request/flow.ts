import { createAction } from '@reduxjs/toolkit';

import { type ActionCallback, withCallback } from '@proton/pass/store/actions/enhancers/callback';
import type { TagMatch, Tagged } from '@proton/pass/types';
import { pipe } from '@proton/pass/utils/fp/pipe';

import { withRequest, withRequestFailure, withRequestSuccess } from './enhancers';
import type { RequestConfig } from './types';

type RequestPrepareAction<P extends any[], R> = (...params: P) => R;
type RequestKeyPrepator<T> = (dto: T) => string;
type RequestKeyDefault = () => string;
type RequestKeyPreparators<T> = RequestKeyDefault | RequestKeyPrepator<T>;

type Payload<T = any> = { payload: T };

export type RequestFlow<I, S, F> = ReturnType<ReturnType<typeof requestActionsFactory<I, S, F>>>;
export type RequestIntent<T extends RequestFlow<any, any, any>> = T extends RequestFlow<infer U, any, any> ? U : never;
export type RequestSuccess<T extends RequestFlow<any, any, any>> = T extends RequestFlow<any, infer U, any> ? U : never;

type CreateRequestActionsOptions<
    IntentDTO,
    IntentPrepared extends Payload,
    IntentData extends boolean,
    SuccessDTO,
    SuccessPrepared extends Payload,
    SuccessData extends boolean,
    FailureDTO,
    FailurePrepared extends Payload,
    FailureData extends boolean,
    RequestKey extends RequestKeyPrepator<IntentDTO>,
> = {
    /** Key option determines requestID generation:
     * - When provided: ${namespace}::${key(dto)} requiring IntentDTO param
     * - When omitted: uses action namespace & `requestID` function becomes `() => string` */
    key?: RequestKey;
    /** Intent action configuration */
    intent?: {
        /** Defaults to `false` - set to `true` to track "intent" request data */
        config?: RequestConfig<'start', IntentData>;
        /** Defaults to `(intent: IntentDTO) => ({ payload: IntentDTO })`  */
        prepare?: RequestPrepareAction<[intent: IntentDTO], IntentPrepared>;
    };
    /** Success action configuration */
    success?: {
        /** Defaults to `false` - set to `true` to track "success" request data */
        config?: RequestConfig<'success', SuccessData>;
        /** Defaults to `(success: SuccessDTO) => ({ payload: SuccessDTO })`  */
        prepare?: RequestPrepareAction<[success: SuccessDTO], SuccessPrepared>;
    };
    /** Failure action configuration */
    failure?: {
        /** Defaults to `false` - set to `true` to track "failure" request data */
        config?: RequestConfig<'failure', FailureData>;
        /** Defaults to `(error: unknown, failure: FailureDTO) => ({ payload: FailureDTO, error: unknown })`  */
        prepare?: RequestPrepareAction<[error: unknown, failure: FailureDTO], FailurePrepared>;
    };
};

/** Creates action creators for each stage of a request sequence:
 * intent, success, and error. These action creators facilitate the
 * dispatching of actions to represent the initiation of a request,
 * successful completion of a request, and handling of errors that
 * occur during the request process. */
export const requestActionsFactory =
    <IntentDTO, SuccessDTO, FailureDTO = void>(namespace: string) =>
    /** All generics include sensible defaults allowing partial `options`:
     * - Prepared types default to `Payload<DTO>` maintaining the payload structure
     * - Data flags default to false (no request tracking)
     * - `RequestKey` defaults to `() => string` when key option is omitted */
    <
        IntentPrepared extends Payload = Payload<IntentDTO>,
        SuccessPrepared extends Payload = Payload<SuccessDTO>,
        FailurePrepared extends Payload = Payload<FailureDTO>,
        IntentData extends boolean = false,
        SuccessData extends boolean = false,
        FailureData extends boolean = false,
        /* Tags default key preparator with 'fallback' for type discrimination
         * while preserving RequestKey type parameter constraints. */
        RequestKey extends RequestKeyPrepator<IntentDTO> = Tagged<RequestKeyPreparators<IntentDTO>, 'fallback'>,
    >(
        options: CreateRequestActionsOptions<
            IntentDTO,
            IntentPrepared,
            IntentData,
            SuccessDTO,
            SuccessPrepared,
            SuccessData,
            FailureDTO,
            FailurePrepared,
            FailureData,
            RequestKey
        > = {}
    ) => {
        type IntentPA = RequestPrepareAction<[intent: IntentDTO], IntentPrepared>;
        type SuccessPA = RequestPrepareAction<[success: SuccessDTO], SuccessPrepared>;
        type FailurePA = RequestPrepareAction<[error: unknown, failure: FailureDTO], FailurePrepared>;
        type RequestPA = TagMatch<RequestKey, 'fallback', RequestKeyDefault, RequestKey>;

        const toPayload = (payload: unknown) => ({ payload });
        const toPayloadWithError = (error: unknown, payload: unknown) => ({ payload, error });

        const intentPA = (options.intent?.prepare ?? toPayload) as IntentPA;
        const successPA = (options.success?.prepare ?? toPayload) as SuccessPA;
        const failurePA = (options.failure?.prepare ?? toPayloadWithError) as FailurePA;
        const requestID = (dto: IntentDTO) =>
            'key' in options && options.key ? `${namespace}::${options.key(dto)}` : namespace;

        return {
            requestID: requestID as RequestPA,
            intent: createAction(`${namespace}::intent`, (dto: IntentDTO, callback?: ActionCallback) =>
                pipe(
                    withRequest({
                        status: 'start',
                        id: requestID(dto),
                        ...(options.intent?.config ?? { data: false as IntentData }),
                    }),
                    withCallback(callback)
                )(intentPA(dto))
            ),
            success: createAction(`${namespace}::success`, withRequestSuccess(successPA, options.success?.config)),
            failure: createAction(`${namespace}::failure`, withRequestFailure(failurePA, options.failure?.config)),
        } as const;
    };
