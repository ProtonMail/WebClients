/**
 * Forgot-password flow state machine — naming conventions:
 * - **States:** camelCase; work-in-progress describes the step (`verifyRecoveryEmail`);
 *   terminal states use a `done*` / `fatal*` / `doneHelp*` prefix.
 * - **Events:** `domain.action` (e.g. `email.code.validated`, `decision.skip`) so related events sort together.
 * - **Actors / machine actions:** camelCase verbs (`fetchRecoveryMethods`, `redirectToSignIn`).
 */
import { assign, fromPromise, setup } from 'xstate';

import type { MnemonicData } from '@proton/components/containers/resetPassword/interface';
import type {
    AccountType,
    DelegatedAccessSummary,
    RecoveryMethod,
    ValidateResetTokenResponse,
} from '@proton/shared/lib/api/reset';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { DelegatedAccessTypeEnum } from '@proton/shared/lib/interfaces/DelegatedAccess';

import { DeviceRecoveryLevel } from '../actions';

type MnemonicDataWithoutAPI = Omit<MnemonicData, 'api'>;
type UnauthedForgotPasswordErrorCode = 'ERROR_FETCHING_RECOVERY_METHODS' | 'ERROR_FETCHING_MNEMONIC';

interface UnauthedForgotPasswordMachineContext {
    username: string;
    accountType: AccountType | '';
    ownershipVerificationMethod: RecoveryMethod | undefined;
    ownershipVerificationCode: string;
    resetResponse: ValidateResetTokenResponse | undefined;
    deviceRecoveryLevel: DeviceRecoveryLevel;
    recoveryMethods: RecoveryMethod[];
    errorCode: UnauthedForgotPasswordErrorCode | undefined;
    resetWithDataLoss: boolean;
    mnemonicData: MnemonicDataWithoutAPI | undefined;
    emailRecoverySkipped: boolean;
    smsRecoverySkipped: boolean;
    delegatedAccessContacts: DelegatedAccessSummary[];
    redactedRecoveryEmail: string | undefined;
    redactedRecoveryPhoneNumber: string | undefined;
}

/** Sent when the user chooses account recovery and recovery methods are known. */
interface RecoverySelectedPayload {
    methods: RecoveryMethod[];
    username: string;
    accountType: AccountType | '';
    redactedEmail: string | undefined;
    redactedPhoneNumber: string | undefined;
}

interface OwnershipRecoveryValidatedPayload {
    ownershipVerificationCode: string;
    resetResponse: ValidateResetTokenResponse;
    deviceRecoveryLevel: DeviceRecoveryLevel;
}

/**
 * Event types use `domain.action` segments so new flows can add siblings without renaming.
 * `decision.*` / `nav.*` are shared UX intents reused across steps.
 */
export type UnauthedForgotPasswordMachineEvent =
    | { type: 'decision.confirm' }
    | { type: 'decision.no' }
    | { type: 'decision.back' }
    | { type: 'decision.skip' }
    | { type: 'decision.yes' }
    | { type: 'email.code.validated'; payload: OwnershipRecoveryValidatedPayload }
    | { type: 'help.opened' }
    | { type: 'mnemonic.validated'; payload: { mnemonicData: MnemonicDataWithoutAPI } }
    | { type: 'mnemonic.prefilled'; payload: { mnemonicData: MnemonicDataWithoutAPI; username: string } }
    | {
          type: 'token.prefilled';
          payload: {
              username: string;
          } & OwnershipRecoveryValidatedPayload;
      }
    | {
          type: 'username.prefilled';
          payload: {
              username: string;
          };
      }
    | {
          type: 'recovery.started';
          payload: RecoverySelectedPayload;
      }
    | { type: 'sms.code.sent' }
    | { type: 'sms.code.validated'; payload: OwnershipRecoveryValidatedPayload }
    | { type: 'socialRecovery.started' };

export enum UnauthedForgotPasswordStateMachineTags {
    hideReturnToSignIn = 'hideReturnToSignIn',
}

export const UnauthedForgotPasswordStateMachine = setup({
    types: {
        context: {} as UnauthedForgotPasswordMachineContext,
        events: {} as UnauthedForgotPasswordMachineEvent,
        tags: {} as `${UnauthedForgotPasswordStateMachineTags}`,
    },
    guards: {
        hasEmailRecovery: ({ context }) => context.recoveryMethods.includes('email') && !context.emailRecoverySkipped,
        hasSmsRecovery: ({ context }) => context.recoveryMethods.includes('sms') && !context.smsRecoverySkipped,
        hasMnemonic: ({ context }) => context.recoveryMethods.includes('mnemonic'),
        hasFullDeviceRecovery: ({ context: { deviceRecoveryLevel } }) =>
            deviceRecoveryLevel === DeviceRecoveryLevel.FULL,
        hasResetResponse: ({ context }) => !!context.resetResponse,
        hasValidatedMnemonicData: ({ context }) => !!context.mnemonicData,
        hasOtherLoggedInSessions: ({ context }) => !!context.resetResponse && context.resetResponse.Sessions.length > 0,
        hasSocialContacts: ({ context }) =>
            context.delegatedAccessContacts?.some(({ Types }) => hasBit(Types, DelegatedAccessTypeEnum.SocialRecovery)),
        hasEmergencyContacts: ({ context }) =>
            context.delegatedAccessContacts?.some(({ Types }) =>
                hasBit(Types, DelegatedAccessTypeEnum.EmergencyAccess)
            ),
    },
    actors: {
        fetchRecoveryMethods: fromPromise(async () => {
            return Promise.resolve([]);
        }),
        checkDeviceRecovery: fromPromise(() => Promise.resolve()),
        checkMnemonic: fromPromise(() => Promise.resolve()),
        checkOtherSessions: fromPromise(() => Promise.resolve()),
        checkSocialRecovery: fromPromise(() => Promise.resolve()),
    },
    actions: {
        redirectToSignIn: () => {},
    },
}).createMachine({
    /** @xstate-layout N4IgpgJg5mDOIC5QDMD2AnKqAuAFAhrLAO4YQB0YAdtugJ4DE6YAxqgG5j3mzb7rZIAbQAMAXUSgADqlgBLbHNRVJIAB6IAbACZN5bQGYALEZHaAnEYCsADgDsdqwBoQdRDYvkr3zUc1W7AEYrEVsAXzCXNEwcAiJSdApqWkYACzAAGylyVClqYXFVGXlFZVUNBE0RPUMTM0tbB2dXREDtU30DKx1NNpsqwJsIqIwsPEISMkoaegYIVjl5ZXIAI3wWAGtRCSQQYoUlFV2Kg0sbck07XQMDO387I3sXNwQ7o3Jbm36zUwfu4ZA0TGcUmiWmKQYUgmCQoUmYyDkGQyBR20lkBzKxy0gRqxlMFms9kcz1agRxXhE5hENja3Ss5isRgBQNi0KmzDYnHoAFkwNhUqgILAADKofAQORUKBzZRgciS9ioDZylnjeLs1gcLh0Xn8wUisUSqUIBWoFj4UpUbbbIroy3lRDed72KyBAweRwGamBEkIXTaC4iQIPcyaL5dOzmZmjVnqsEcrU8vkCoWi8WS6UQWXyqiK5XkVUgmHkBNcnXJ-Vpo1QE25s0Ww7WwKovZ2w4Ov3mOz6UNU9o6QbmbS+mnkIzmCeaSxum4GKfRmJq0EUUva3Upg3pqUyqhy035wts+OasvryuGjO1xXmy3W7Qt-b2rEINqaAwXK5+EQ3II2Ay+gxtHObRuj-ICLG6YwrAXYEjxXE81wrVML23Lh0AwcgpAyC1ogAWwLGMl2LVckz1ZCtxrU0b0bcQbV2R922fV930uftv1uQZ-xaP0ug+b87BsXsyS9fwYNjZdKFw-BEQAJQQ+gADUuDkZA6AAYUFMAGDAKTEXINh5nIdh8AyOQIAtFFbRKRjQAqRlnUcN0PSsL0aQAkILlDIJtHaFzgiGSJAUIosph06SMjkzltSU9AVPUzS5gWJYqB4DY5CkOi0WszFbMdRlyBdJztE9b1fRxPRfD-YIRG-XQ-2gwLDzjChYFw2BIsTOgAEFiGk7ANPmBhWtgfTNJ4ZJMtbbKjlyv17B7KcfgHQTh24zR1vISMIPMd0gPMDwxKIqZho6sser6gatPmFhFkOVZ1i2Qp6LbHL1EQYruwsRb+20QdVpeGwAi8DwAn2y4hxcw6QrBE75O63qFEuxKbuS1L0smhjXoqCxPt7JbfpW31x3eYNbiuMwgy9Qwobgng2tO6LlNUpHhtGwzjNM8zBAgDGXpmt7KipTb-FDIMdD8OxfTsG5Az2y4QgZf5GuC2nYaixSmfiwbrtu5ZYDSjKnqyjF+YqRbhfpAZxcuX0327fwgz8HaRFMSHlcXaGKAyesMgAIQegBXKQ1PSTYdz3OsDxV5ryG980-cD4PQ42K961vWijamk2OzaawvB0L4g36VzNCJmwRHIQJQzDQJTC9Mw7BpmO45M-3NiDkPWA2bT0HQ9BMOw7A8IIj3aZbhP26TrvU+o5RrUzzHTdaXz86A8vBjfalS+424rE27oBJ0Qx9vdJuJPHtuNg75QEXQXDkd1lK2CoW-cN56aOysf73vdPRHm6cwbov6MnsGfYsF9E4aRfnIO+D9Ub63RgvPmOdLiBErqBCwuhqTaGpETBk5AaqXB0EOMkO0ozu1gjHXCu5cLKDkCwBm3AWDJwzNyGhdCWBdWMoifAKxEQKEYFmXcOY8wqmjhJahOkOGMLoPpFhUo2FSKoPQrh4VeH8OwHQGeDY54ZwfMg587puy12pKEKuNhxwOF9Dgnynk-w1Q8B4Lo2gwFTEkbQ5RDC4ZyK7qw9hnjVE8L4aZTR4cRFKjEaPKh-j6EyJ8ZsPxSiVHcOwsEgR2j05iCEM2Ky2cmLGHfIyK4DxirrRAtvF4wYLFeB8sEYq3QjDGEbhQ8SxZ3HSO8cw3xCiYmcJSeokJjA0IYSwjhDA+EmoSN6XErpCSelJL6WotJmiMk0SyUgj++TGleCMMUowpSdDdDKlONBADAiUl6OXMwriwTtM8XEqQqR0CEDAAAURmIwO59CjImTMhZHmGy8mzUEjUfw9hsGA28FxSp-Q9CMkgmSewBMDA3IoF8rx6tZGPOebAN5Hy4F3TWJsd+QKBY9E6HUAkjRiTcQnHvRwEM2icV0M0kYUSpkLIeU8l57yIQ63gQbElT5ZozkKbs4q+y7iHIqa0Haf8LF2Bqo0wCQ4UUtKOrc6Z3jsU8vxfyu6CCMo5OepskVgExV7IOeU6xv096GFdNLSwlIbguPVZ7cg6KuU4rADIglyxn6vyFTZAWbo3Q7MtVK613EfL+E2l0V0XwPBBmqKioyTM5CQC6hkQQ6AqAWRmfIqAAB5fkXAADKcBkqwDCfuSJlCJJchUhmiAWac15sEAW7pxbS3oArUQQ4sBVm6PWfo01IbRYfnaEOK4c5qgypfCDAhYZGREK+D5VNjaESZuzVwdtPrOmFpLekXtlaB09z7gPMZd8R71uLJu5trbd35oPV2o95bT3KEHVRHRVo9G5OFeOqok7xzFUMFUdaZUGQBlqGDGk+1dkbvTduttz7MU5B7X2qtIdUD0KuklO6dA4BBqxu9UwehgyGHJg7G4RgyqKvMJ0IpxgzAgRdoh2KW6W07tzahzq6Hj2YYHdh3DfqUpUFQMRpefoyOVxnVRkINGyoeAY-tFy346iuksOxptyGn0du8esRQnBBPKAAJJUF4OgAOLBLSibRobUdpLsaRneAEQGVdqTlxxnRykjHdnMZ8iEJkbrab3t0zx-TaHYBmjkCZGRncw5CIjqIm9rSphha4yhyLfHos3Ti3DBLKdv2ZMkx2QCugCEGFrk08p9h52DHJFOKrQYGQCUsK6tlt70tIcy3p-dUWYv5cxYV89IzB7D0mXenrj6Iv9Zy4NiKBXk5Dt-SO-9waTgxsq9V8VoE7iQe2YDUM3Rgj1y0yFmOGWZt7ribl2Li3MVFuQMgLgQ0Fu3b4AISyJqnOID8MVSdvh6RfDlT5iuR3rACUVfYG42nOPXd42WHg724ZPZe+gOzhrSuGPWucAS-kCSDFo9xQYv1Ayhi9MYWubQ4cPu4zd7xOkuAwCoCwbqLAWCVrR69-VyxCOwGx7Nf79srhA-2oJOcSnbFdFU6ENzXY1WdbS2CK79PEfakksz6gbOuoc6589nn+HljicFwLYXgPrDi9ByT+wzp6RQ6C-YgKSuNUUFV1lubSOmeYG1+zznRARtJfCVHdlU2ON0493E73LOdd64D8t4razTcVCMOc841hAIOxcoDerTjNoOGDG8ekfhafhYZ2h6Pvvdf+9gCN4Z-dRlD3Gal13abw9l-V9wSvrO-eVsKyt+ejmAMp50CL3QluQeS5J5Yd8Zh1r+BAlXawmhU0B1zNNtX2WkeGbkMZj9FncDoVwlIbAdn+fJ9ldLt01I8TyzfNYxFY5AaGGq2SN0q-1-t967NuJO+9-9s-UP1QGP1P15zEwk0BWH0vwDCq1clv0cHv2jWPkYweDfBuBIUVyClDymDX3dz61uzkCgF3AgHMzklxWwDLUECkGrTAPswvz9HqXIF7BXSqVDQf0GCfy-iq0aTf0wMmxwM-x02-3Lz427zZygT4Bs0oLAGoMx0FUgI23ekVTtSaWdWMHLkliQKqyYMBmMF8DJHFVTS5nwFFCIDIL5GE05zPyIwUJIwQAVnOBqjMD0OpB2iUy-iYPWgCEtl6HCAuwkmMNMPajgAsIFBE1oJN1sKkwcIIRqlqCqAlwO3OEAR2hAkPmhw6ywK6zBChGagrWwCDkhFVnwE4ABSH0UJfC8KYOz3pB8k+GaBeEMHLiXXazJhwSPlTVyOXHyMKK6OLFgBKOEGNWNigMqNjQZHdFqMo0BmsUaQrgARvwsW+G-CMLAHYFwxkQADFUAkRUBiAABVKQBgdYNgNfbAEsOAbADAb7EYio5rNBXQMMQwOI2FTQxo90CuaoVohwdo9dAEcTeYeAXYfgxIdbOwgAWnnUhNTWSHoDBKk12XeAaGXxAnhSAhHFjRdQJAhnqkyJBPgkxTPHImrHhI7HFzjV2WDERNsBtmjV2U2nLi6DAhwWlhX38OLDClkjhhijikulJOfBxgWj7H+z+msRqk2nHEsF6HOUZCMVTTVk6nOkRk0n5KF2-gQCFm8BqhMSgznD4PEX6Ppm5M1j5J+1GMhwIUpMAnqDDFT1tkuB7BuCLmCBxEjFTQgUnkK1VJDTuDQQQO6FCGcJpGhXcFn0ZEwWKjnSCHIRd3dQ9KvmDhvhgVwm9IqFrkVQ+Htzg18A+hsF9BCDQVVVuAsHQJCDxINLcS1UxVTMdGJ0qQcAYxdm8BAhpFT38H1OwM1U5RfTmSgEUQ8WSSWQ0ReFuLsPOXVKrjuAKh8n6C7BFnKVTU9W1W5VxV5ThLNIqOlnfAKTBj2gbLePejMDQSnBpEDMZCpFZSyOVzRSrL4x1VxRkRrJfHOT0CqyAmsGcMVVriU0Enz04jnF0EVlL2EM7xHKzlGJxHyiqH2iZUpEApDMqLJ2lgaWDGpGVWdyvNbzwJ-x7LSilDfRPQAIsyfNQoDGgppF+jgqa0gzDUeC-BfNT1dGAoRy3w1xwAE331rzCM5yfN+lDE2m-EAXaBdirh9Bt3aCXVnOMA+jfGYs309w1z-zABMyoHM0s2swA0Xg7HKQrh3PsFa2CAPJfHozjSY3xFYzZNjNCw30j28TuyG06i9I3LsK+m3LaEVRAlMAaEg1CErnOS+NdmnBjMwvdWwpEKR3soe06m53QCfL0L0GjPaAsVcN2SU2CE8gsGqCJzpAwvxLbyEJYoUq71wi1x72r313RyfMaQdJlwsS-gMIeClwDAcBPMGFF2DEspCusq-0KqjxKp9zKrjy4q7jio9C8EMvWlOF2W8B8veFKVZJEFFy3g-zCtApIt8AY3ItgqHGoujW-ArlU1OAVyuGrhWpsvwIMxs132Us4qAJAJIuUP3kWtDC+AEj-HnTqLcv6EjAeEeFCDOp6vkoIKIMgFIJCIoKoKBNHKkxZPlSC0LwMNDHYOSOf24Kq2EgBoKqBsZ36pj3ihoEM2kOoN4saXeEVWLIp3OT8DrPekMADH-j0NT3TPLM7IoFwPOpwqiyDhkAEDUmSC4HMzQHWq7HJwovOR2rcOjQow+EGFBntRxiMItBMNkGCPIMsLACqq+BUMeFuDl0AVzw8HJ2lmpAVhwWCyspjj6LIB6KkBIvHHOGpzSP6DXSMqaL0DBnYgEkeA3lWPWM5y2J2O9gONtucphuLk8NazuC-l0DdGsQ+Pzm+Koz+ItoCNlGr1QDOLIKuOYAgDir2gIUjEAhDBDDEveP6B0NsFnOlkcSMNlE9nMOwCfOAQDGDFlsDJlJpuMsWvzx6C6BdipHOxTuLCSy2PCkgCbvaCRK-ia1OEMBuCSMrinEjBdiaR0A7OyIoCS1eVxqryGqqvxwKhMBjq+BlIZCl2PIuUp1T1T2Tq6pjiSwAAlMgpBXk1AFBeLw7mCWro7egELPKAw+xk0QJfpM9U1kAlaMhXle4MASLmyxwfITAv4PymSyo3NTKuwXyvJyEIggA */
    id: 'forgotPassword',
    initial: 'entry',
    context: {
        username: '',
        accountType: '',
        ownershipVerificationMethod: undefined,
        ownershipVerificationCode: '',
        resetResponse: undefined,
        deviceRecoveryLevel: DeviceRecoveryLevel.NONE,
        recoveryMethods: [],
        errorCode: undefined,
        resetWithDataLoss: false,
        mnemonicData: undefined,
        emailRecoverySkipped: false,
        smsRecoverySkipped: false,
        delegatedAccessContacts: [],
        redactedRecoveryEmail: undefined,
        redactedRecoveryPhoneNumber: undefined,
    },

    states: {
        /** User picks recovery path (account request, help, or pre-filled reset). */
        entry: {
            tags: [UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn],
            on: {
                'recovery.started': {
                    target: 'loadRecoveryMethods',
                    actions: assign(({ event }) => ({
                        recoveryMethods: event.payload.methods,
                        username: event.payload.username,
                        accountType: event.payload.accountType,
                        redactedRecoveryEmail: event.payload.redactedEmail,
                        redactedRecoveryPhoneNumber: event.payload.redactedPhoneNumber,
                    })),
                },
                'help.opened': {
                    target: 'doneHelpExit',
                },
                'decision.back': {
                    actions: {
                        type: 'redirectToSignIn',
                    },
                },
                'mnemonic.prefilled': {
                    target: 'setNewPassword',
                    actions: assign(({ event }) => ({
                        username: event.payload.username,
                        mnemonicData: event.payload.mnemonicData,
                    })),
                },
                'username.prefilled': {
                    target: 'entry',
                    actions: assign(({ event }) => ({
                        username: event.payload.username,
                    })),
                },
                'token.prefilled': {
                    target: 'setNewPassword',
                    actions: assign(({ event }) => ({
                        username: event.payload.username,
                        ownershipVerificationMethod: 'mnemonic',
                        ownershipVerificationCode: event.payload.ownershipVerificationCode,
                        resetResponse: event.payload.resetResponse,
                        delegatedAccessContacts: event.payload.resetResponse.DelegatedAccesses,
                        deviceRecoveryLevel: event.payload.deviceRecoveryLevel,
                    })),
                },
            },
        },

        loadRecoveryMethods: {
            invoke: {
                src: 'fetchRecoveryMethods',
                onDone: [
                    {
                        guard: 'hasEmailRecovery',
                        target: 'verifyRecoveryEmail',
                    },
                    {
                        guard: 'hasSmsRecovery',
                        target: 'enterRecoverySms',
                    },
                    {
                        target: 'mnemonicRecovery.checkMnemonic',
                    },
                ],
                onError: {
                    target: 'fatalError',
                    actions: assign(() => ({ errorCode: 'ERROR_FETCHING_RECOVERY_METHODS' })),
                },
            },
        },

        verifyRecoveryEmail: {
            on: {
                'email.code.validated': {
                    target: 'checkDeviceRecovery',
                    actions: assign(({ event }) => ({
                        ownershipVerificationMethod: 'email',
                        ownershipVerificationCode: event.payload.ownershipVerificationCode,
                        resetResponse: event.payload.resetResponse,
                        delegatedAccessContacts: event.payload.resetResponse.DelegatedAccesses,
                        deviceRecoveryLevel: event.payload.deviceRecoveryLevel,
                    })),
                },
                'decision.back': {
                    target: 'entry',
                    actions: assign(() => ({ smsRecoverySkipped: false, emailRecoverySkipped: false })),
                },
                'decision.skip': {
                    target: 'loadRecoveryMethods',
                    actions: assign(() => ({ emailRecoverySkipped: true })),
                },
            },
        },

        enterRecoverySms: {
            on: {
                'sms.code.sent': {
                    target: 'verifyRecoverySms',
                },
                'decision.back': {
                    target: 'entry',
                    actions: assign(() => ({ smsRecoverySkipped: false, emailRecoverySkipped: false })),
                },
                'decision.skip': {
                    target: 'loadRecoveryMethods',
                    actions: assign(() => ({ smsRecoverySkipped: true })),
                },
            },
        },

        verifyRecoverySms: {
            on: {
                'sms.code.validated': {
                    target: 'checkDeviceRecovery',
                    actions: assign(({ event }) => ({
                        ownershipVerificationMethod: 'sms',
                        ownershipVerificationCode: event.payload.ownershipVerificationCode,
                        resetResponse: event.payload.resetResponse,
                        delegatedAccessContacts: event.payload.resetResponse.DelegatedAccesses,
                        deviceRecoveryLevel: event.payload.deviceRecoveryLevel,
                    })),
                },
                'decision.back': {
                    target: 'enterRecoverySms',
                },
                'decision.skip': {
                    target: 'loadRecoveryMethods',
                    actions: assign(() => ({ smsRecoverySkipped: true })),
                },
            },
        },

        checkDeviceRecovery: {
            invoke: {
                src: 'checkDeviceRecovery',
                onDone: [
                    {
                        guard: 'hasFullDeviceRecovery',
                        target: 'setNewPassword',
                    },
                    {
                        target: 'mnemonicRecovery.checkMnemonic',
                    },
                ],
                onError: {
                    target: 'mnemonicRecovery.checkMnemonic',
                },
            },
        },

        mnemonicRecovery: {
            initial: 'checkMnemonic',
            states: {
                checkMnemonic: {
                    invoke: {
                        src: 'checkMnemonic',
                        onDone: [
                            {
                                guard: 'hasMnemonic',
                                target: 'enterPhrase',
                            },
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.authenticatedRecovery',
                            },
                            {
                                target: '#forgotPassword.unauthenticatedRecovery',
                            },
                        ],
                        onError: {
                            target: '#forgotPassword.fatalError',
                            actions: assign(() => ({ errorCode: 'ERROR_FETCHING_MNEMONIC' })),
                        },
                    },
                },
                enterPhrase: {
                    on: {
                        'mnemonic.validated': {
                            target: 'confirmPhrase',
                            actions: assign(({ event }) => ({ mnemonicData: event.payload.mnemonicData })),
                        },
                        'decision.back': {
                            target: '#forgotPassword.entry',
                            actions: assign(() => ({ smsRecoverySkipped: false, emailRecoverySkipped: false })),
                        },
                        'decision.skip': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.authenticatedRecovery.checkOtherSessions',
                            },
                            {
                                target: '#forgotPassword.unauthenticatedRecovery',
                            },
                        ],
                    },
                },
                confirmPhrase: {
                    on: {
                        'decision.back': {
                            target: 'enterPhrase',
                        },
                        'decision.confirm': {
                            target: '#forgotPassword.setNewPassword',
                        },
                    },
                },
            },
        },

        /** After mnemonic skip: user already proved ownership (email/SMS). */
        authenticatedRecovery: {
            initial: 'checkOtherSessions',
            states: {
                checkOtherSessions: {
                    invoke: {
                        src: 'checkOtherSessions',
                        onDone: [
                            {
                                guard: 'hasOtherLoggedInSessions',
                                target: 'otherSessionsPrompt',
                            },
                            {
                                target: 'checkSocialRecovery',
                            },
                        ],
                        onError: {
                            target: 'checkSocialRecovery',
                        },
                    },
                },
                otherSessionsPrompt: {
                    on: {
                        'decision.yes': {
                            target: 'activeSessionInstructions',
                        },
                        'decision.back': [
                            {
                                guard: 'hasValidatedMnemonicData',
                                target: '#forgotPassword.mnemonicRecovery.confirmPhrase',
                            },
                            {
                                target: '#forgotPassword.entry',
                            },
                        ],
                        'decision.no': {
                            target: 'checkSocialRecovery',
                        },
                    },
                },
                activeSessionInstructions: {
                    on: {
                        'decision.skip': {
                            target: 'checkSocialRecovery',
                        },
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                checkSocialRecovery: {
                    invoke: {
                        src: 'checkSocialRecovery',
                        onDone: [
                            {
                                guard: 'hasSocialContacts',
                                target: 'socialRecoveryOffer',
                            },
                            {
                                guard: 'hasEmergencyContacts',
                                target: 'emergencyAccessOffer',
                            },
                            {
                                target: '#forgotPassword.offerDataLossReset',
                            },
                        ],
                        onError: {
                            target: '#forgotPassword.offerDataLossReset',
                        },
                    },
                },
                socialRecoveryOffer: {
                    on: {
                        'socialRecovery.started': {
                            target: '#forgotPassword.setNewPassword',
                        },
                        'decision.back': {
                            target: '#forgotPassword.mnemonicRecovery.enterPhrase',
                        },
                        'decision.skip': [
                            {
                                guard: 'hasEmergencyContacts',
                                target: 'emergencyAccessOffer',
                            },
                            {
                                target: '#forgotPassword.offerDataLossReset',
                            },
                        ],
                    },
                },
                emergencyAccessOffer: {
                    on: {
                        'decision.yes': {
                            target: '#forgotPassword.unauthenticatedRecovery.emergencyContactInstructions',
                        },
                        'decision.back': {
                            target: '#forgotPassword.mnemonicRecovery.enterPhrase',
                        },
                        'decision.no': {
                            target: '#forgotPassword.offerDataLossReset',
                        },
                    },
                },
            },
        },

        /** After mnemonic skip: user has not completed ownership verification. */
        unauthenticatedRecovery: {
            initial: 'otherSessionsPrompt',
            states: {
                otherSessionsPrompt: {
                    on: {
                        'decision.yes': {
                            target: 'activeSessionInstructions',
                        },
                        'decision.no': {
                            target: 'emergencyAccessOffer',
                        },
                        'decision.back': {
                            target: '#forgotPassword.entry',
                        },
                    },
                },
                activeSessionInstructions: {
                    on: {
                        'decision.skip': {
                            target: 'emergencyAccessOffer',
                        },
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                emergencyAccessOffer: {
                    on: {
                        'decision.yes': {
                            target: 'emergencyContactInstructions',
                        },
                        'decision.no': {
                            target: '#forgotPassword.recoveryFailed',
                        },
                        'decision.back': {
                            target: 'otherSessionsPrompt',
                        },
                    },
                },
                emergencyContactInstructions: {
                    on: {
                        'decision.skip': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.offerDataLossReset',
                            },
                            {
                                target: '#forgotPassword.recoveryFailed',
                            },
                        ],
                        'decision.back': [
                            {
                                guard: 'hasResetResponse',
                                target: '#forgotPassword.authenticatedRecovery.emergencyAccessOffer',
                            },
                            {
                                target: 'emergencyAccessOffer',
                            },
                        ],
                    },
                },
            },
        },

        offerDataLossReset: {
            on: {
                'decision.yes': {
                    target: '#forgotPassword.setNewPassword',
                    actions: assign(() => ({ resetWithDataLoss: true })),
                },
                'decision.skip': {
                    target: 'recoveryFailed',
                },
            },
        },

        setNewPassword: {
            tags: [UnauthedForgotPasswordStateMachineTags.hideReturnToSignIn],
        },

        recoveryFailed: {
            on: {
                'decision.back': {
                    target: '#forgotPassword.unauthenticatedRecovery.emergencyAccessOffer',
                },
            },
        },

        doneHelpExit: {
            type: 'final',
        },

        fatalError: {
            type: 'final',
        },
    },
});
