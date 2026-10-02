import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useNotifications } from '@proton/app-context/useNotifications';
import { mockNotifications } from '@proton/components/testing/mockNotifications';

import * as passAliasesProvider from '../../PassAliasesProvider';
import CreatePassAliasesForm from './CreatePassAliasesForm';

jest.mock('../../PassAliasesProvider', () => ({
    __esModule: true,
    ...jest.requireActual('../../PassAliasesProvider'),
}));
jest.mock('@proton/app-context/useNotifications');

const SUFFIX = '.suffix@passmail.net';
const MAILBOX = { id: 1, email: 'user@proton.me' };

describe('CreatePassAliasesForm', () => {
    const submitNewAlias = jest.fn();

    beforeEach(() => {
        jest.mocked(useNotifications).mockImplementation(() => mockNotifications);
        jest.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(
            () =>
                ({
                    submitNewAlias,
                    getAliasOptions: jest.fn().mockResolvedValue({
                        mailboxes: [MAILBOX],
                        suffixes: [{ suffix: SUFFIX, signedSuffix: 'signed-suffix' }],
                    }),
                }) as any
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    const renderForm = async () => {
        render(<CreatePassAliasesForm modalProps={{ open: true }} onSubmit={jest.fn()} passAliasesURL="" />);

        return {
            nameInput: await screen.findByLabelText('Alias title'),
            aliasInput: screen.getByLabelText('Your alias'),
        };
    };

    it('derives the alias from the name', async () => {
        const { nameInput, aliasInput } = await renderForm();

        await userEvent.type(nameInput, 'Amazon');

        expect(aliasInput).toHaveValue(`amazon${SUFFIX}`);
    });

    it('keeps the alias in sync with the name after the alias field has been focused and blurred', async () => {
        const { nameInput, aliasInput } = await renderForm();

        await userEvent.type(nameInput, 'Amazon');
        await userEvent.click(aliasInput);
        await userEvent.clear(nameInput);
        await userEvent.type(nameInput, 'Ebay');

        expect(aliasInput).toHaveValue(`ebay${SUFFIX}`);

        await userEvent.click(screen.getByText('Create and copy alias'));

        expect(submitNewAlias).toHaveBeenCalledWith(expect.objectContaining({ name: 'Ebay', alias: `ebay${SUFFIX}` }));
    });
});
