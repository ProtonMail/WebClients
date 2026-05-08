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

    describe('when there is a href', () => {
        it('should render inside <a> tag and tooltip', () => {
            render(
                <EncryptionStatusIcon
                    isEncrypted={false}
                    fill={2}
                    text="This email adress is invalid"
                    loading={false}
                    shouldHaveHref={true}
                />
            );
            const tooltip = screen.getByTestId('encryption-icon-tooltip');
            // workaround to be able to get by tag
            const href = within(tooltip).getByText((_, el) => el?.tagName.toLowerCase() === 'a');
            within(href).getByText('This email adress is invalid');
            within(href).getByTestId('encryption-icon');
        });
    });

    describe('when shouldHaveHref is false', () => {
        it('should render only inside tooltip', () => {
            render(
                <EncryptionStatusIcon
                    isEncrypted={false}
                    fill={2}
                    loading={false}
                    text="This email adress is invalid"
                    shouldHaveHref={false}
                />
            );

            const tooltip = screen.getByTestId('encryption-icon-tooltip');
            within(tooltip).getByText('This email adress is invalid');
            within(tooltip).getByTestId('encryption-icon');

            expect(within(tooltip).queryByText((_, el) => el?.tagName.toLowerCase() === 'a')).toBeNull();
        });
    });
});
