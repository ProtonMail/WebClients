import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { renderHook, waitFor } from '@testing-library/react';

import { isDesktopEnvironment } from '@proton/lumo-api-client/core/desktop-tools';

import { useDesktopQuickAsk } from './useDesktopQuickAsk';

jest.mock('@proton/lumo-api-client/core/desktop-tools', () => ({
    isDesktopEnvironment: jest.fn(),
}));

const mockIsDesktop = isDesktopEnvironment as jest.MockedFunction<typeof isDesktopEnvironment>;

const wrapperAt = (url: string) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <StrictMode>
            <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
        </StrictMode>
    );
    return Wrapper;
};

const renderAt = (url: string) =>
    renderHook(
        () => {
            const query = useDesktopQuickAsk();
            const location = useLocation();
            return { query, url: `${location.pathname}${location.search}${location.hash}` };
        },
        { wrapper: wrapperAt(url) }
    );

let nonceCounter = 0;
// Nonces are memoised module-wide, so each test uses its own.
const nextNonce = () => `nonce-${++nonceCounter}`;

afterEach(() => {
    delete window.LumoQuickAsk;
    mockIsDesktop.mockReset();
});

test('desktop: trades the nonce for the question once, even under StrictMode', async () => {
    mockIsDesktop.mockReturnValue(true);
    const take = jest.fn().mockResolvedValueOnce('what is the weather?').mockResolvedValue(null);
    window.LumoQuickAsk = { take };
    const nonce = nextNonce();

    const { result } = renderAt(`/#quickask=${nonce}`);

    await waitFor(() => expect(result.current.query).toBe('what is the weather?'));
    expect(take).toHaveBeenCalledTimes(1);
    expect(take).toHaveBeenCalledWith(nonce);
    expect(result.current.url).toBe('/');
});

test('desktop: a nonce the shell does not recognise yields nothing', async () => {
    mockIsDesktop.mockReturnValue(true);
    const take = jest.fn().mockResolvedValue(null);
    window.LumoQuickAsk = { take };

    const { result } = renderAt(`/#quickask=${nextNonce()}`);

    await waitFor(() => expect(take).toHaveBeenCalled());
    expect(result.current.query).toBeNull();
});

test('web: the marker is stripped and the bridge never asked', async () => {
    mockIsDesktop.mockReturnValue(false);
    const take = jest.fn().mockResolvedValue('should not be used');
    window.LumoQuickAsk = { take };

    const { result } = renderAt(`/#quickask=${nextNonce()}`);

    await waitFor(() => expect(result.current.url).toBe('/'));
    expect(result.current.query).toBeNull();
    expect(take).not.toHaveBeenCalled();
});

test('desktop: a plain q is not a quick ask', async () => {
    mockIsDesktop.mockReturnValue(true);
    const take = jest.fn();
    window.LumoQuickAsk = { take };

    const { result } = renderAt('/#q=hello');

    expect(result.current.query).toBeNull();
    expect(take).not.toHaveBeenCalled();
});
