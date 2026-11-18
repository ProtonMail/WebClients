import { act, fireEvent, render, renderHook, waitFor } from '@testing-library/react';

import { Autopay } from '@proton/payments/core/constants';

import { getStoreWrapper } from '../contacts/tests/vitest/render';
import RenewToggle, { useRenewToggle } from './RenewToggle';

vi.mock('@proton/atoms/Portal/Portal');
// Works around "checked" not updating on <input type="checkbox" />
vi.mock('../../components/toggle/Toggle', () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(({ id, checked, onChange, ...rest }: any) => (
        <button type="button" id={id} onClick={() => onChange(!checked)} {...rest}>
            {checked ? 'CHECKED' : ''}
        </button>
    )),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

const { Wrapper } = getStoreWrapper();

it('should render', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper: Wrapper });
    const { container } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    expect(container).not.toBeEmptyDOMElement();
});

it('should be checked when RenewState is Active', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper: Wrapper });
    const { getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

it('should be unchecked when RenewState is Disabled', () => {
    const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.DISABLE }), { wrapper: Wrapper });
    const { getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    expect(getByTestId('toggle-subscription-renew')).not.toHaveTextContent('CHECKED');
});

it('should show modal when user disables auto renew', () => {
    const { result } = renderHook(() => useRenewToggle({}), { wrapper: Wrapper });
    const { container, rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerender(<RenewToggle {...result.current} />);

    expect(container).toHaveTextContent('Our system will no longer auto-charge you using this payment method');
});

it('should not toggle off if user clicked Keep auto-pay/Cancel', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useRenewToggle({}), { wrapper: Wrapper });
    const { container, rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerenderHook();
    rerender(<RenewToggle {...result.current} />);
    expect(container).toHaveTextContent('Are you sure?');

    fireEvent.click(getByTestId('action-keep-autopay'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<RenewToggle {...result.current} />);

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

it('should toggle off if user clicked Disable', async () => {
    const { result, rerender: rerenderHook } = renderHook(() => useRenewToggle({}), { wrapper: Wrapper });
    const { container, rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    rerenderHook();
    rerender(<RenewToggle {...result.current} />);
    expect(container).toHaveTextContent('Are you sure?');

    fireEvent.click(getByTestId('action-disable-autopay'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<RenewToggle {...result.current} />);

    await waitFor(() => {
        expect(getByTestId('toggle-subscription-renew')).not.toHaveTextContent('CHECKED');
    });
});

it('should toggle on without modal', async () => {
    const { result, rerender: rerenderHook } = renderHook(
        () => useRenewToggle({ initialRenewState: Autopay.DISABLE }),
        { wrapper: Wrapper }
    );
    const { container, rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

    fireEvent.click(getByTestId('toggle-subscription-renew'));
    await waitFor(() => {});
    rerenderHook();
    rerender(<RenewToggle {...result.current} />);

    expect(container).not.toHaveTextContent('Our system will no longer auto-charge you using this payment method');

    expect(getByTestId('toggle-subscription-renew')).toHaveTextContent('CHECKED');
});

describe('useRenewToggle', () => {
    it('onChange should return ENABLE if toggled on', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.DISABLE }), {
            wrapper: Wrapper,
        });

        expect(await result.current.onChange()).toEqual(Autopay.ENABLE);
    });

    it('onChange should return DISABLE if toggled off', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.ENABLE }), {
            wrapper: Wrapper,
        });
        const { rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

        let onChangePromise!: ReturnType<typeof result.current.onChange>;
        // Block body: returning the promise would make act wait for the modal to be answered
        act(() => {
            onChangePromise = result.current.onChange();
        });
        rerender(<RenewToggle {...result.current} />);

        fireEvent.click(getByTestId('action-disable-autopay'));

        expect(await onChangePromise).toEqual(Autopay.DISABLE);
    });

    it('onChange should return null if the checkbox was not toggled off', async () => {
        const { result } = renderHook(() => useRenewToggle({ initialRenewState: Autopay.ENABLE }), {
            wrapper: Wrapper,
        });
        const { rerender, getByTestId } = render(<RenewToggle {...result.current} />, { wrapper: Wrapper });

        let onChangePromise!: ReturnType<typeof result.current.onChange>;
        // Block body: returning the promise would make act wait for the modal to be answered
        act(() => {
            onChangePromise = result.current.onChange();
        });
        rerender(<RenewToggle {...result.current} />);

        fireEvent.click(getByTestId('action-keep-autopay'));

        expect(await onChangePromise).toEqual(null);
    });
});
