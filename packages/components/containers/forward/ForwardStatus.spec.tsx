import { render } from '@testing-library/react';

import { ForwardingState, OutgoingAddressForwarding } from '@proton/shared/lib/interfaces';

import ForwardStatus from './ForwardStatus';

describe('ForwardStatus', () => {
    const setup = (state: ForwardingState) => {
        const utils = render(<ForwardStatus forward={{ State: state } as OutgoingAddressForwarding} />);
        return { ...utils };
    };
    describe('when forward is pending', () => {
        it('should render a pending badge', () => {
            const { getByText } = setup(ForwardingState.Pending);
            expect(getByText('Pending')).toBeInTheDocument();
        });
    });

    describe('when forward is active', () => {
        it('should render an active badge', () => {
            const { getByText } = setup(ForwardingState.Active);
            expect(getByText('Active')).toBeInTheDocument();
        });
    });

    describe('when forward is outdated', () => {
        it('should render an outdated badge', () => {
            const { getByText } = setup(ForwardingState.Outdated);
            expect(getByText('Outdated')).toBeInTheDocument();
        });
    });

    describe('when forward is paused', () => {
        it('should render a paused badge', () => {
            const { getByText } = setup(ForwardingState.Paused);
            expect(getByText('Paused')).toBeInTheDocument();
        });
    });

    describe('when forward is rejected', () => {
        it('should render a rejected badge', () => {
            const { getByText } = setup(ForwardingState.Rejected);
            expect(getByText('Declined')).toBeInTheDocument();
        });
    });
});
