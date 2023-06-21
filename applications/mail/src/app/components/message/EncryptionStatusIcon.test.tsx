import { render, within } from '@testing-library/react';

import EncryptionStatusIcon from './EncryptionStatusIcon';

describe('EncryptionStatusIcon', () => {
    describe('when loading is true', () => {
        it('should render loader', () => {
            const { getByTestId, getByText } = render(<EncryptionStatusIcon loading />);
            getByTestId('circle-loader');
            getByText('Loading');
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
            const { queryByTestId, getByTestId, getByText } = render(<EncryptionStatusIcon {...props} />);

            getByTestId('encryption-icon');
            getByText('End to End encrypted');
            expect(queryByTestId('encryption-icon-tooltip')).toBeNull();
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
            const { getByTestId } = render(<EncryptionStatusIcon {...props} />);
            const tooltip = getByTestId('encryption-icon-tooltip');
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
            const { getByTestId } = render(<EncryptionStatusIcon {...props} />);

            const tooltip = getByTestId('encryption-icon-tooltip');
            within(tooltip).getByText('This email adress is invalid');
            within(tooltip).getByTestId('encryption-icon');

            expect(within(tooltip).queryByText((_, el) => el?.tagName.toLowerCase() === 'a')).toBeNull();
        });
    });
});
