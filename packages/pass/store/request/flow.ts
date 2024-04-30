import { createAction } from '@reduxjs/toolkit';

import { withRequest, withRequestFailure, withRequestSuccess } from './enhancers';
import type { RequestConfig } from './types';

type RequestPrepareAction<P extends any[], R> = (...params: P) => R;
type Payload<T = any> = { payload: T };

export type RequestFlow<I, S, F> = ReturnType<ReturnType<typeof requestActionsFactory<I, S, F>>>;
export type RequestIntent<T extends RequestFlow<any, any, any>> = T extends RequestFlow<infer U, any, any> ? U : never;
export type RequestSuccess<T extends RequestFlow<any, any, any>> = T extends RequestFlow<any, infer U, any> ? U : never;

type CreateRequestActionsOptions<
    IntentDTO,
    SuccessDTO,
    FailureDTO,
    IntentData extends boolean,
    SuccessData extends boolean,
    FailureData extends boolean,
    IntentPrepared extends Payload,
    SuccessPrepared extends Payload,
    FailurePrepared extends Payload,
> = {
    requestId: (dto: IntentDTO) => string;
    intent?: {
        config?: RequestConfig<'start', IntentData>;
        prepare?: RequestPrepareAction<[intent: IntentDTO], IntentPrepared>;
    };

    success?: {
        config?: RequestConfig<'success', SuccessData>;
        prepare?: RequestPrepareAction<[success: SuccessDTO], SuccessPrepared>;
    };

    failure?: {
        config?: RequestConfig<'failure', FailureData>;
        prepare?: RequestPrepareAction<[error: unknown, failure: FailureDTO], FailurePrepared>;
    };
};

/** Creates action creators for each stage of a request sequence:
 * intent, success, and error. These action creators facilitate the
 * dispatching of actions to represent the initiation of a request,
 * successful completion of a request, and handling of errors that
 * occur during the request process.*/
export const requestActionsFactory =
    <IntentDTO, SuccessDTO, FailureDTO = void>(namespace: string) =>
    <
        IntentPrepared extends Payload = Payload<IntentDTO>,
        SuccessPrepared extends Payload = Payload<SuccessDTO>,
        FailurePrepared extends Payload = Payload<FailureDTO>,
        IntentData extends boolean = false,
        SuccessData extends boolean = false,
        FailureData extends boolean = false,
    >(
        options: CreateRequestActionsOptions<
            IntentDTO,
            SuccessDTO,
            FailureDTO,
            IntentData,
            SuccessData,
            FailureData,
            IntentPrepared,
            SuccessPrepared,
            FailurePrepared
        >
    ) => {
        type IntentPA = RequestPrepareAction<[intent: IntentDTO], IntentPrepared>;
        type SuccessPA = RequestPrepareAction<[success: SuccessDTO], SuccessPrepared>;
        type FailurePA = RequestPrepareAction<[error: unknown, failure: FailureDTO], FailurePrepared>;

        const toPayload = (payload: unknown) => ({ payload });
        const toPayloadWithError = (error: unknown, payload: unknown) => ({ payload, error });

        const intentPA = (options.intent?.prepare ?? toPayload) as IntentPA;
        const successPA = (options.success?.prepare ?? toPayload) as SuccessPA;
        const failurePA = (options.failure?.prepare ?? toPayloadWithError) as FailurePA;

        return {
            intent: createAction(`${namespace}::intent`, (payload: IntentDTO) =>
                withRequest({
                    status: 'start',
                    id: options.requestId(payload),
                    ...(options.intent?.config ?? { data: false as IntentData }),
                })(intentPA(payload))
            ),
            success: createAction(`${namespace}::success`, withRequestSuccess(successPA, options.success?.config)),
            failure: createAction(`${namespace}::failure`, withRequestFailure(failurePA, options.failure?.config)),
        };
    };
