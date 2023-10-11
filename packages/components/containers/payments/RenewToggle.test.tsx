import { fireEvent, render, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';

import { mockSubscriptionCache } from '@proton/components/hooks/helpers/test';
import { Autopay } from '@proton/components/payments/core';
import { applyHOCs, hookWrapper, withCache } from '@proton/testing';

import RenewToggle, { useRenewToggle } from './RenewToggle';

jest.mock('@proton/components/components/portal/Portal');
jest.mock('@proton/components/components/toggle/Toggle');

beforeEach(() => {
    jest.clearAllMocks();

    mockSubscriptionCache();
});

const providers = [withCache()];
const ContextRenewToggle = applyHOCs(...providers)(RenewToggle);
const wrapper = hookWrapper(...providers);

it('should render', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper });
    const { container } = render(<ContextRenewToggle {...result.current} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should be checked when RenewState is Active', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper });
    const { getByTestId } = render(<ContextRenewToggle {...result.current} />);

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

it('should be unchecked when RenewState is Disabled', () => {
    const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.DISABLE }), { wrapper });
    const { getByTestId } = render(<ContextRenewToggle {...result.current} />);

    expect(getByTestId('toggle-subscription-renew')).not.toHaveTextContent('CHECKED');
});

it('should show modal when user disables auto renew', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper });
    const { container, getByTestId, rerender } = render(<ContextRenewToggle {...result.current} />);

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerender(<ContextRenewToggle {...result.current} />);

    expect(container).toHaveTextContent('Our system will no longer auto-charge you using this payment method');
});

it('should not toggle off if user clicked Keep auto-pay/Cancel', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useRenewToggle({}), { wrapper });
    const { getByTestId, rerender, container } = render(<ContextRenewToggle {...result.current} />);

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerenderHook();
    rerender(<ContextRenewToggle {...result.current} />);
    expect(container).toHaveTextContent('Are you sure?');

    fireEvent.click(getByTestId('action-keep-autopay'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<ContextRenewToggle {...result.current} />);

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

it('should toggle off if user clicked Disable', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useRenewToggle({}), { wrapper });
    const { getByTestId, rerender, container } = render(<ContextRenewToggle {...result.current} />);

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerenderHook();
    rerender(<ContextRenewToggle {...result.current} />);
    expect(container).toHaveTextContent('Are you sure?');

    fireEvent.click(getByTestId('action-disable-autopay'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<ContextRenewToggle {...result.current} />);

    await waitFor(() => {
        expect(getByTestId('toggle-subscription-renew')).not.toHaveTextContent('CHECKED');
    });
});

it('should toggle on without modal', async () => {
    const { result, rerender: rerenderHook } = renderHook(
        () => useRenewToggle({ initialRenewState: Autopay.DISABLE }),
        { wrapper }
    );
    const { getByTestId, container, rerender } = render(<ContextRenewToggle {...result.current} />);

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<ContextRenewToggle {...result.current} />);

    expect(container).not.toHaveTextContent('Our system will no longer auto-charge you using this payment method');

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

describe('useRenewToggle', () => {
    it('onChange should return ENABLE if toggled on', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.DISABLE }), { wrapper });

        expect(await result.current.onChange()).toEqual(Autopay.ENABLE);
    });

    it('onChange should return DISABLE if toggled off', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.ENABLE }), { wrapper });
        const { getByTestId, rerender } = render(<ContextRenewToggle {...result.current} />);

        const onChangePromise = result.current.onChange();
        rerender(<ContextRenewToggle {...result.current} />);

        fireEvent.click(getByTestId('action-disable-autopay'));

        expect(await onChangePromise).toEqual(Autopay.DISABLE);
    });

    it('onChange should return null if the checkbox was not toggled off', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.ENABLE }), { wrapper });
        const { getByTestId, rerender } = render(<ContextRenewToggle {...result.current} />);

        const onChangePromise = result.current.onChange();
        rerender(<ContextRenewToggle {...result.current} />);

        fireEvent.click(getByTestId('action-keep-autopay'));

        expect(await onChangePromise).toEqual(null);
    });
});
