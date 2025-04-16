import { render, screen, within } from '@testing-library/react';

import EncryptionStatusIcon from './EncryptionStatusIcon';

describe('EncryptionStatusIcon', () => {
    describe('when loading is true', () => {
        it('should render loader', () => {
            render(<EncryptionStatusIcon loading />);
            screen.getByTestId('circle-loader');
            screen.getByText('Loading');
        });
    });

    describe('when fill or encrypted is undefined', () => {
        it('should not render anything', () => {
            const { container } = render(<EncryptionStatusIcon fill={undefined} loading={false} />);
            expect(container.firstChild).toBeNull();
        });

        it('should not render anything', () => {
            const { container } = render(<EncryptionStatusIcon isEncrypted={undefined} loading={false} />);
            expect(container.firstChild).toBeNull();
        });
    });

    describe('when isDetailsModal is true', () => {
        it('should not render icon in span', () => {
            const props = {
                isEncrypted: true,
                fill: 2,
                text: 'End to End encrypted',
                loading: false,
                isDetailsModal: true,
            };
            render(<EncryptionStatusIcon {...props} />);

            screen.getByTestId('encryption-icon');
            screen.getByText('End to End encrypted');
            expect(screen.queryByTestId('encryption-icon-tooltip')).toBeNull();
        });
    });

    describe('when there is a href', () => {
        it('should render inside <a> tag and tooltip', () => {
            const props = {
                isEncrypted: false,
                fill: 2,
                loading: false,
                text: 'This email adress is invalid',
            };
            render(<EncryptionStatusIcon {...props} />);
            const tooltip = screen.getByTestId('encryption-icon-tooltip');
            // workaround to be able to get by tag
            const href = within(tooltip).getByText((_, el) => el?.tagName.toLowerCase() === 'a');
            within(href).getByText('This email adress is invalid');
            within(href).getByTestId('encryption-icon');
        });
    });

    describe('when shouldHaveHref is false', () => {
        it('should render only inside tooltip', () => {
            const props = {
                isEncrypted: false,
                fill: 2,
                loading: false,
                text: 'This email adress is invalid',
                shouldHaveHref: false,
            };
            render(<EncryptionStatusIcon {...props} />);

            const tooltip = screen.getByTestId('encryption-icon-tooltip');
            within(tooltip).getByText('This email adress is invalid');
            within(tooltip).getByTestId('encryption-icon');

            expect(within(tooltip).queryByText((_, el) => el?.tagName.toLowerCase() === 'a')).toBeNull();
        });
    });
});
