import { fireEvent } from '@testing-library/react';
import { Field, Formik } from 'formik';

import { render } from '../../../utils/tests/render';
import { ItemIconField } from './ItemIconField';

jest.mock('webextension-polyfill', () => ({}));
jest.mock('imask/esm/masked/range', () => ({}));

const PNG_ICON = 'data:image/png;base64,iVBORw0KGgo=';

type Values = { icon?: string };

/** Renders through a real `<Field component>`: formik only passes
 * `field` and `form` to it (no `meta`), which unit props would hide */
const renderField = (initialValues: Values, errors?: Record<string, string>) =>
    render(
        <Formik<Values> initialValues={initialValues} initialErrors={errors} onSubmit={jest.fn()}>
            <Field name="icon" component={ItemIconField} icon="user" />
        </Formik>
    );

describe('ItemIconField', () => {
    test('renders the fallback icon when no icon is set', () => {
        const { getByRole, queryByRole, container } = renderField({});

        expect(getByRole('button', { name: 'Set custom icon' })).toBeInTheDocument();
        expect(queryByRole('button', { name: 'Remove custom icon' })).toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    test('renders a valid icon and allows removing it', () => {
        const { getByRole, queryByRole, container } = renderField({ icon: PNG_ICON });

        expect(container.querySelector('img')?.getAttribute('src')).toBe(PNG_ICON);

        fireEvent.click(getByRole('button', { name: 'Remove custom icon' }));
        expect(queryByRole('button', { name: 'Remove custom icon' })).toBeNull();
        expect(container.querySelector('img')).toBeNull();
    });

    test('never renders an invalid icon but still allows clearing it', () => {
        const error = 'Icon image is invalid';
        const { getByRole, container } = renderField({ icon: 'https://tracker.example/pixel.png' }, { icon: error });

        expect(container.querySelector('img')).toBeNull();
        expect(getByRole('button', { name: 'Set custom icon' })).toHaveAttribute('title', error);
        expect(getByRole('button', { name: 'Remove custom icon' })).toBeInTheDocument();
    });
});
