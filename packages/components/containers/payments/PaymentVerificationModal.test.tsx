import { render, waitFor } from '@testing-library/react';
import { wait } from '@testing-library/user-event/dist/utils';

import { applyHOCs, withNotifications } from '@proton/testing/index';

import PaymentVerificationModal, { PromiseWithController, Props } from './PaymentVerificationModal';

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
        token: 'token123',
        onProcess: jest.fn().mockReturnValue(promiseWithController),
    };
});

const ContextPaymentVerificationModal = applyHOCs(withNotifications())(PaymentVerificationModal);

it('should render', () => {
    const { container } = render(<ContextPaymentVerificationModal {...props} />);

    expect(container).not.toBeEmptyDOMElement();
});

it('should render redirect step by default', () => {
    const { queryByTestId, queryByText } = render(<ContextPaymentVerificationModal {...props} />);

    expect(queryByTestId('redirect-message')).toBeInTheDocument();
    expect(queryByText('Verify')).toBeInTheDocument();
});

it('should set redirecting step once user clicks on verify', () => {
    const { queryByTestId, getByText } = render(<ContextPaymentVerificationModal {...props} />);

    getByText('Verify').click();

    expect(queryByTestId('redirecting-message')).toBeInTheDocument();
});

it('should set redirected after processingDelay passes', async () => {
    const processingDelay = 100;
    const { queryByTestId, getByText } = render(
        <ContextPaymentVerificationModal {...props} processingDelay={processingDelay} />
    );

    getByText('Verify').click();

    await wait(processingDelay);

    expect(queryByTestId('redirected-message')).toBeInTheDocument();
});

it('should set fail step if promise rejects', async () => {
    const { queryByTestId, getByText } = render(<ContextPaymentVerificationModal {...props} />);

    getByText('Verify').click();

    promiseReject(new Error());

    await waitFor(() => expect(queryByTestId('fail-message')).toBeInTheDocument());
});

it('should call onSubmit and the onClose callback if promise resolves', async () => {
    const { getByText } = render(<ContextPaymentVerificationModal {...props} />);

    getByText('Verify').click();

    promiseResolve();

    await waitFor(() => expect(props.onSubmit).toHaveBeenCalledTimes(1));
    expect(props.onClose).toHaveBeenCalledTimes(1);
});

it('should abort the promise and call onClose if user cancels', async () => {
    const processingDelay = 100;
    const { getByText } = render(<ContextPaymentVerificationModal {...props} processingDelay={processingDelay} />);

    getByText('Verify').click();

    await wait(processingDelay);

    getByText('Cancel').click();

    await waitFor(() => expect(props.onClose).toHaveBeenCalledTimes(1));
    expect(promiseWithController.abort.abort).toHaveBeenCalledTimes(1);
});
