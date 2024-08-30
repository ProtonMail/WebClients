import { render, screen, waitFor } from '@testing-library/react';

import { wait } from '@proton/shared/lib/helpers/promise';
import { applyHOCs, withNotifications } from '@proton/testing';

import type { PromiseWithController, Props } from './PaymentVerificationModal';
import PaymentVerificationModal from './PaymentVerificationModal';

jest.mock('@proton/components/components/portal/Portal');

let props: Props;
let promiseWithController: PromiseWithController;
let promiseResolve: () => void;
let promiseReject: (error: any) => void;

beforeEach(() => {
    jest.clearAllMocks();

    promiseWithController = {
        promise: new Promise((resolve, reject) => {
            promiseResolve = resolve;
            promiseReject = reject;
        }),
        abort: {
            abort: jest.fn(),
        } as any,
    };

    props = {
        onSubmit: jest.fn(),
        onClose: jest.fn(),
        onProcess: jest.fn().mockReturnValue(promiseWithController),
    };
});

const ContextPaymentVerificationModal = applyHOCs(withNotifications())(PaymentVerificationModal);

it('should render', () => {
    const { container } = render(<ContextPaymentVerificationModal {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should render redirect step by default', () => {
    render(<ContextPaymentVerificationModal {...props} />);

    expect(screen.getByTestId('redirect-message')).toBeInTheDocument();
    expect(screen.getByText('Verify')).toBeInTheDocument();
});

it('should set redirecting step once user clicks on verify', async () => {
    render(<ContextPaymentVerificationModal {...props} />);
    screen.getByText('Verify').click();
    expect(await waitFor(() => screen.findByTestId('redirecting-message'))).toBeInTheDocument();
});

it('should set redirected after processingDelay passes', async () => {
    const processingDelay = 100;
    render(<ContextPaymentVerificationModal {...props} processingDelay={processingDelay} />);

    screen.getByText('Verify').click();

    await wait(processingDelay);

    expect(await waitFor(() => screen.findByTestId('redirected-message'))).toBeInTheDocument();
});

it('should set fail step if promise rejects', async () => {
    render(<ContextPaymentVerificationModal {...props} />);

    screen.getByText('Verify').click();

    promiseReject(new Error());

    await screen.findByTestId('fail-message');
});

it('should call onSubmit and the onClose callback if promise resolves', async () => {
    render(<ContextPaymentVerificationModal {...props} />);

    screen.getByText('Verify').click();

    promiseResolve();

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1));
    expect(props.onClose).toHaveBeenCalledTimes(1);
});

it('should abort the promise and call onClose if user cancels', async () => {
    const processingDelay = 100;
    render(<ContextPaymentVerificationModal {...props} processingDelay={processingDelay} />);

    screen.getByText('Verify').click();

    await wait(processingDelay);

    await (await waitFor(() => screen.findByText('Cancel'))).click();

    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
    expect(promiseWithController.abort.abort).toHaveBeenCalledTimes(1);
});
