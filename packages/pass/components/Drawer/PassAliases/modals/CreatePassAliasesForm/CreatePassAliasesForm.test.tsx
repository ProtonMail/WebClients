import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useNotifications } from '@proton/app-context/useNotifications';
import { mockNotifications } from '@proton/components/testing/vitest/mockNotifications';

import * as passAliasesProvider from '../../PassAliasesProvider';
import CreatePassAliasesForm from './CreatePassAliasesForm';

vi.mock('../../PassAliasesProvider', async () => ({
    __esModule: true,
    ...(await vi.importActual('../../PassAliasesProvider')),
}));
vi.mock('@proton/app-context/useNotifications');

const SUFFIX = '.suffix@passmail.net';
const MAILBOX = { id: 1, email: 'user@proton.me' };

describe('CreatePassAliasesForm', () => {
    const submitNewAlias = vi.fn();

    beforeEach(() => {
        vi.mocked(useNotifications).mockImplementation(() => mockNotifications);
        vi.spyOn(passAliasesProvider, 'usePassAliasesContext').mockImplementation(
            () =>
                ({
                    submitNewAlias,
                    getAliasOptions: vi.fn().mockResolvedValue({
                        mailboxes: [MAILBOX],
                        suffixes: [{ suffix: SUFFIX, signedSuffix: 'signed-suffix' }],
                    }),
                }) as any
        );
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    const renderForm = async () => {
        render(<CreatePassAliasesForm modalProps={{ open: true }} onSubmit={vi.fn()} passAliasesURL="" />);

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

    it('submits the form when pressing Enter in the title field', async () => {
        const { nameInput } = await renderForm();

        // Let the debounced validation run once with the empty title
        await new Promise((resolve) => setTimeout(resolve, 300));

        await userEvent.type(nameInput, 'Amazon{Enter}');

        expect(submitNewAlias).toHaveBeenCalledWith(expect.objectContaining({ name: 'Amazon' }));
    });
});
