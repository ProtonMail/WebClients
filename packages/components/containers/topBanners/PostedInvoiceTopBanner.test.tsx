import { act, render, screen } from '@testing-library/react';
import { format } from 'date-fns';

import { POSTED_INVOICE_BANNER_STORAGE_KEY, type PaymentsInitData } from '@proton/account/paymentsInit';
import { getModelState } from '@proton/account/testing/getModelState';
import { DAY } from '@proton/shared/lib/constants';
import { dateLocale } from '@proton/shared/lib/i18n';
import type { UserModel } from '@proton/shared/lib/interfaces';
import { addApiMock, apiMock, clearApiMocks } from '@proton/test-api/api';

import { getStoreWrapper, renderWithProviders } from '../../testing/renderWithProviders';
import { PostedInvoiceTopBanner } from './PostedInvoiceTopBanner';

const DUE_TIME = new Date('2026-10-01T12:00:00Z');

const getPaymentsInitPreloadedState = (postedInvoices: PaymentsInitData['postedInvoices']) => ({
    paymentsInit: getModelState<PaymentsInitData>({
        hasPostedInvoices: postedInvoices.length > 0,
        postedInvoices,
        userCode: 1000,
    }),
});

const mockInit = (count: number) =>
    addApiMock('payments/v5/init', () => ({
        User: {
            Code: 1000,
            PostedInvoices: Array.from({ length: count }, (_, i) => ({
                ID: `invoice-${i}`,
                CreateTime: Math.floor((Date.now() - (count - i) * DAY) / 1000),
                DueTime: Math.floor(DUE_TIME.getTime() / 1000),
            })),
        },
    }));

const setDismissedFor = (invoiceId: string, ageMs = 0) =>
    localStorage.setItem(
        POSTED_INVOICE_BANNER_STORAGE_KEY,
        JSON.stringify({ value: invoiceId, at: Date.now() - ageMs })
    );

const getPayableUserPreloadedState = (postedInvoices: PaymentsInitData['postedInvoices']) => ({
    ...getPaymentsInitPreloadedState(postedInvoices),
    user: getModelState({ canPay: true, isFree: false } as UserModel),
});

describe('PostedInvoiceTopBanner', () => {
    describe('eligibility', () => {
        it('should not render or fetch payments init when the user cannot pay', () => {
            mockInit(1);

            const { container } = renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: {
                    ...getPaymentsInitPreloadedState([
                        { id: 'invoice-0', createTime: DUE_TIME.getTime(), dueTime: DUE_TIME.getTime() },
                    ]),
                    user: getModelState({ canPay: false, isFree: false } as UserModel),
                },
            });

            expect(container).toBeEmptyDOMElement();
            expect(apiMock).not.toHaveBeenCalled();
        });

        it('should not render or fetch payments init for free-plan users', () => {
            mockInit(1);

            const { container } = renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: {
                    ...getPaymentsInitPreloadedState([
                        { id: 'invoice-0', createTime: DUE_TIME.getTime(), dueTime: DUE_TIME.getTime() },
                    ]),
                    user: getModelState({ canPay: true, isFree: true } as UserModel),
                },
            });

            expect(container).toBeEmptyDOMElement();
            expect(apiMock).not.toHaveBeenCalled();
        });
    });

    describe('banner content', () => {
        beforeEach(() => {
            localStorage.clear();
            clearApiMocks();
            apiMock.mockClear();
        });

        it('should not render anything when the user has no posted invoices', () => {
            const { container } = renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([]),
            });

            expect(container).toBeEmptyDOMElement();
        });

        it('should display the banner with the formatted due date when the user has a posted invoice', () => {
            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-0', createTime: DUE_TIME.getTime(), dueTime: DUE_TIME.getTime() },
                ]),
            });

            const banner = screen.getByTestId('posted-invoice');
            expect(banner).toHaveTextContent(
                `You have an open invoice on ${format(DUE_TIME, 'PPP', { locale: dateLocale })}`
            );
        });

        it('should display the banner without a date when DueTime is missing', () => {
            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([{ id: 'a', createTime: Date.now(), dueTime: undefined }]),
            });

            const banner = screen.getByTestId('posted-invoice');
            expect(banner).toHaveTextContent('You have an open invoice');
            expect(banner.textContent).not.toContain('on ');
        });

        it('should not render while the invoice is dismissed within 25 days', () => {
            setDismissedFor('invoice-a');

            const { container } = renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-a', createTime: Date.now(), dueTime: Date.now() + 10 * DAY },
                ]),
            });

            expect(container).toBeEmptyDOMElement();
        });

        it('should render again once the dismissal is older than 25 days', () => {
            setDismissedFor('invoice-a', 26 * DAY);

            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-a', createTime: Date.now(), dueTime: Date.now() + 3 * DAY },
                ]),
            });

            expect(screen.getByTestId('posted-invoice')).toBeInTheDocument();
        });

        it('should show the banner when the dismissed invoice was paid and another one remains', () => {
            setDismissedFor('invoice-b');

            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-a', createTime: Date.now(), dueTime: Date.now() + 10 * DAY },
                ]),
            });

            expect(screen.getByTestId('posted-invoice')).toBeInTheDocument();
        });

        it('should show the banner when a new invoice comes first after dismissing another one', () => {
            const dueTime = Date.now() + 10 * DAY;
            setDismissedFor('invoice-old');

            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-new', createTime: Date.now(), dueTime },
                    { id: 'invoice-old', createTime: Date.now(), dueTime: Date.now() + 30 * DAY },
                ]),
            });

            const banner = screen.getByTestId('posted-invoice');
            expect(banner).toHaveTextContent(format(new Date(dueTime), 'PPP', { locale: dateLocale }));
        });

        it('should hide and persist the dismissed invoice id when closed', () => {
            renderWithProviders(<PostedInvoiceTopBanner />, {
                preloadedState: getPayableUserPreloadedState([
                    { id: 'invoice-a', createTime: Date.now(), dueTime: Date.now() + 10 * DAY },
                ]),
            });

            act(() => {
                screen.getByTitle('Close this banner').click();
            });

            expect(screen.queryByTestId('posted-invoice')).toBeNull();
            expect(JSON.parse(localStorage.getItem(POSTED_INVOICE_BANNER_STORAGE_KEY) ?? '{}').value).toEqual(
                'invoice-a'
            );
        });

        it('should fetch payments init only once when remounted', async () => {
            mockInit(1);

            const { Wrapper } = getStoreWrapper();
            const { unmount } = render(<PostedInvoiceTopBanner />, { wrapper: Wrapper });
            await screen.findByTestId('posted-invoice');
            expect(apiMock).toHaveBeenCalledTimes(1);

            unmount();
            render(<PostedInvoiceTopBanner />, { wrapper: Wrapper });
            await screen.findByTestId('posted-invoice');
            expect(apiMock).toHaveBeenCalledTimes(1);
        });
    });
});
