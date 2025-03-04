import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import UncontainedWrapper from './UncontainedWrapper';

const setup = (children = <div style={{ width: '300px' }}>Content</div>, props = {}) => {
    return render(
        <div style={{ width: '200px' }}>
            <UncontainedWrapper {...props}>{children}</UncontainedWrapper>
        </div>
    );
};

test('renders children inside the wrapper', () => {
    setup();
    expect(screen.getByText('Content')).toBeInTheDocument();
});

test('applies className to the outer container', () => {
    setup(<div>Test Content</div>, { className: 'custom-class' });
    expect(screen.getByTestId('uncontained-wrapper-container')).toHaveClass('custom-class');
});

test('applies innerClassName to the scrollable container', () => {
    setup(<div>Test Content</div>, { innerClassName: 'inner-custom-class' });
    expect(screen.getByTestId('uncontained-wrapper')).toHaveClass('inner-custom-class');
});
