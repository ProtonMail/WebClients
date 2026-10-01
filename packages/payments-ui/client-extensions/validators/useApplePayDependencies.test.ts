import { act, renderHook } from '@testing-library/react';

import { getCanMakePaymentsWithActiveCard } from '@proton/chargebee/lib/getCanMakePaymentsWithActiveCard';
import { getOfferedApplePayFlow, setOfferedApplePayFlow } from '@proton/payments/core/apple-pay-support';
import type { ChargebeeIframeHandles } from '@proton/payments/core/interface';
import { isDesktop } from '@proton/shared/lib/helpers/browser';
import { useFlag } from '@proton/unleash/useFlag';

import { useApplePayDependencies } from './validators';

jest.mock('@proton/unleash/useFlag');
jest.mock('@proton/chargebee/lib/getCanMakePaymentsWithActiveCard');
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: jest.fn() }),
}));
const createModal = jest.fn(() => 'modal-id');
const removeModal = jest.fn();
jest.mock('@proton/components/hooks/useModals', () => () => ({ createModal, removeModal }));
jest.mock('@proton/shared/lib/helpers/browser', () => ({
    ...jest.requireActual('@proton/shared/lib/helpers/browser'),
    isDesktop: jest.fn(),
}));

const mockedIsDesktop = jest.mocked(isDesktop);
const mockedUseFlag = jest.mocked(useFlag);
const mockedCanMakePaymentsOnCurrentDomain = jest.mocked(getCanMakePaymentsWithActiveCard);

const getApplePayCapabilities = jest.fn();
const handles = { getApplePayCapabilities } as unknown as ChargebeeIframeHandles;

const modalHandles = {
    onPaymentFailure: jest.fn(),
    onVerificationCancelled: jest.fn(),
    onVerificationSuccess: jest.fn(),
    onQrPendingModalClosed: jest.fn(),
};

const renderAndSettle = async () => {
    const { result } = renderHook(() => useApplePayDependencies(handles, modalHandles));

    // the availability check is asynchronous, and a null outcome is a real answer rather than a pending one
    await act(async () => {});

    return result;
};

/** The flow the check settled on, which is both what gates the button and what telemetry reports */
const renderAndGetOfferedFlow = async () => {
    const result = await renderAndSettle();

    return { offeredFlow: getOfferedApplePayFlow(), canUseApplePay: result.current.canUseApplePay };
};

/** Present in Safari and every other WebKit browser on iOS; the app never loads Apple's SDK that would fake it */
const setNativeApplePaySession = (isPresent: boolean) => {
    if (isPresent) {
        (window as any).ApplePaySession = {};
    } else {
        delete (window as any).ApplePaySession;
    }
};

afterEach(() => setNativeApplePaySession(false));

beforeEach(() => {
    jest.clearAllMocks();
    setOfferedApplePayFlow(null);
    mockedIsDesktop.mockReturnValue(true);
    mockedCanMakePaymentsOnCurrentDomain.mockResolvedValue(true);
    getApplePayCapabilities.mockResolvedValue({ canMakePaymentsWithActiveCard: true, applePayCapabilities: true });
});

describe('useApplePayDependencies', () => {
    describe('with a native ApplePaySession', () => {
        beforeEach(() => setNativeApplePaySession(true));

        it('offers the native flow when Apple Pay is available', async () => {
            mockedUseFlag.mockReturnValue(true);

            await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                offeredFlow: 'native',
                canUseApplePay: true,
            });
        });

        /**
         * Today this cohort - a Wallet with no usable card, or a closed lid putting Touch ID out of
         * reach - sees no Apple Pay at all, and reports no variant rather than a native one it never got.
         */
        it('offers nothing when the native sheet is unavailable', async () => {
            mockedUseFlag.mockReturnValue(true);
            getApplePayCapabilities.mockResolvedValue({
                canMakePaymentsWithActiveCard: false,
                applePayCapabilities: false,
            });

            await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                offeredFlow: null,
                canUseApplePay: false,
            });
        });

        /** Brave iOS: ua-parser-js names it Brave, so isSafari() is false, yet the sheet is native WebKit */
        describe('on a mobile browser that is not Safari', () => {
            beforeEach(() => mockedIsDesktop.mockReturnValue(false));

            it('offers the native flow once the capabilities flag is on', async () => {
                mockedUseFlag.mockReturnValue(true);

                await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                    offeredFlow: 'native',
                    canUseApplePay: true,
                });
                expect(getApplePayCapabilities).toHaveBeenCalledWith({ applePayCapabilitiesEnabled: true });
            });

            it('offers the native flow while the capabilities flag is off, checking both origins', async () => {
                mockedUseFlag.mockReturnValue(false);

                await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                    offeredFlow: 'native',
                    canUseApplePay: true,
                });
                expect(mockedCanMakePaymentsOnCurrentDomain).toHaveBeenCalledTimes(1);
                expect(getApplePayCapabilities).toHaveBeenCalledWith({ applePayCapabilitiesEnabled: false });
            });
        });
    });

    describe('without a native ApplePaySession', () => {
        beforeEach(() => setNativeApplePaySession(false));

        it('offers the QR flow on desktop once the capabilities flag is on', async () => {
            mockedUseFlag.mockReturnValue(true);

            await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                offeredFlow: 'qr',
                canUseApplePay: true,
            });
        });

        it('does not attempt the QR flow while the capabilities flag is off', async () => {
            mockedUseFlag.mockReturnValue(false);

            await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                offeredFlow: null,
                canUseApplePay: false,
            });
            expect(getApplePayCapabilities).not.toHaveBeenCalled();
            expect(mockedCanMakePaymentsOnCurrentDomain).not.toHaveBeenCalled();
        });

        it('offers nothing on mobile, where there is no QR flow', async () => {
            mockedUseFlag.mockReturnValue(true);
            mockedIsDesktop.mockReturnValue(false);

            await expect(renderAndGetOfferedFlow()).resolves.toEqual({
                offeredFlow: null,
                canUseApplePay: false,
            });
        });
    });

    it('withdraws the offered flow when the button fails to mount, so nothing is attributed to it', async () => {
        setNativeApplePaySession(false);
        mockedUseFlag.mockReturnValue(true);

        const result = await renderAndSettle();
        expect(getOfferedApplePayFlow()).toBe('qr');

        await act(async () => result.current.applePayModalHandles.onMountFailure());

        expect(getOfferedApplePayFlow()).toBeNull();
        expect(result.current.canUseApplePay).toBe(false);
    });

    describe('pending validation modal', () => {
        const clickApplePay = async () => {
            const result = await renderAndSettle();
            act(() => result.current.applePayModalHandles.onClick());
            return result;
        };

        it('is not shown for the native flow', async () => {
            setNativeApplePaySession(true);
            mockedUseFlag.mockReturnValue(true);

            await clickApplePay();

            expect(createModal).not.toHaveBeenCalled();
        });

        describe('in the QR flow', () => {
            beforeEach(() => {
                setNativeApplePaySession(false);
                mockedUseFlag.mockReturnValue(true);
            });

            it('is shown on click', async () => {
                await clickApplePay();

                expect(createModal).toHaveBeenCalledTimes(1);
            });

            it.each(['onAuthorize', 'onCancel', 'onFailure', 'onMountFailure'] as const)(
                'is hidden on %s',
                async (handle) => {
                    const result = await clickApplePay();

                    act(() => result.current.applePayModalHandles[handle](undefined));

                    expect(removeModal).toHaveBeenCalledWith('modal-id');
                }
            );

            it('reports a cancellation and asks for a retry when the user closes it', async () => {
                await clickApplePay();
                const [[modal]] = createModal.mock.calls as unknown as [[React.ReactElement<{ onClose: () => void }>]];

                act(() => modal.props.onClose());

                expect(removeModal).toHaveBeenCalledWith('modal-id');
                expect(modalHandles.onVerificationCancelled).toHaveBeenCalledTimes(1);
                expect(modalHandles.onQrPendingModalClosed).toHaveBeenCalledTimes(1);
            });
        });
    });
});
