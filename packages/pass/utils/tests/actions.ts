import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { escapeRegex } from '@proton/shared/lib/helpers/regex';

const region = (id: string) => {
    const element = document.getElementById(id);
    if (!element) throw new Error(`Region #${id} is not rendered`);
    return within(element);
};

export const sidebar = () => region('pass-sidebar');
export const itemList = () => region('pass-sub-sidebar');
export const itemView = () => region('content');

/** Sidebar entries render their item count after the name */
const selectSidebarEntry = async (name: string) =>
    userEvent.click(await sidebar().findByRole('button', { name: new RegExp(`^${escapeRegex(name)}`) }));

export const selectVault = selectSidebarEntry;
export const openTrash = () => selectSidebarEntry('Trash');

export const openItem = async (name: string) => {
    await userEvent.click(await itemList().findByText(name));
    await itemView().findByRole('heading', { name });
};

const getField = (label: string) => {
    const field = itemView().getByText(label).closest<HTMLElement>('[role="button"]');
    if (!field) throw new Error(`No copyable field labelled "${label}"`);
    return field;
};

export const copyField = (label: string) => userEvent.click(getField(label));

export const findNotification = (text: string) => screen.findByText(text);

/** Picks an entry in the item view "More options" menu */
export const runItemAction = async (action: string) => {
    await userEvent.click(itemView().getByRole('button', { name: 'More options' }));
    await userEvent.click(await screen.findByRole('button', { name: action }));
};

/** Fills form inputs by label, replacing any current value */
const fillForm = async (values: Record<string, string>) => {
    for (const [label, value] of Object.entries(values)) {
        const input = await screen.findByLabelText(label);
        await userEvent.clear(input);
        await userEvent.type(input, value);
    }
};

const submitForm = async (action: string) => userEvent.click(screen.getByRole('button', { name: action }));

export type LoginFormValues = { name: string; email?: string; password?: string };

const intoLoginForm = ({ name, email, password }: Partial<LoginFormValues>) =>
    Object.fromEntries(
        Object.entries({ Title: name, 'Email or username': email, Password: password }).filter(
            ([, value]) => value !== undefined
        )
    ) as Record<string, string>;

export const createLogin = async (values: LoginFormValues) => {
    await userEvent.click(screen.getByRole('button', { name: /Create item/ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Login' }));
    await fillForm(intoLoginForm(values));
    await submitForm('Create login');
    await itemView().findByRole('heading', { name: values.name });
};

export const editLogin = async (values: Partial<LoginFormValues>) => {
    await userEvent.click(itemView().getByRole('button', { name: 'Edit' }));
    await fillForm(intoLoginForm(values));
    await submitForm('Save');
    await itemView().findByRole('button', { name: 'Edit' });
};
