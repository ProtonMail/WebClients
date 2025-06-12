import React from 'react';

import { render, screen } from '@testing-library/react';

import { withHoc } from './withHoc';

type HookProps = { input: string };
type InjectedProps = { label: string };

const mockHook = jest.fn<InjectedProps, [HookProps]>(({ input }) => ({
    label: `Label: ${input}`,
}));

const DummyComponent: React.FC<InjectedProps> = ({ label }) => {
    return <div>{label}</div>;
};

const WrappedComponent = withHoc(mockHook, DummyComponent);

describe('withHoc', () => {
    it('calls hook with props and renders component with injected props', () => {
        render(<WrappedComponent input="Test" />);

        expect(mockHook).toHaveBeenCalledWith({ input: 'Test' });

        expect(screen.getByText('Label: Test')).toBeInTheDocument();
    });
});
