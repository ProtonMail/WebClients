import { render, screen } from '@testing-library/react';

import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { CategorySettingsItem } from './CategorySettingsItem';

describe('CategorySettingsItem', () => {
    it('should hide display toggle and notify checkbox if categories are disabled', () => {
        render(
            <CategorySettingsItem
                loading={false}
                categoriesEnabled={false}
                updateDisplay={jest.fn()}
                updateNotify={jest.fn()}
                category={{
                    id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    display: true,
                    notify: true,
                    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                }}
            />
        );

        const display = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-display`);
        expect(display).toHaveClass('hidden');
        const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-notify`);
        // The `hidden` class is applied to the Checkbox's wrapping label, not the input itself
        expect(checkbox.parentElement).toHaveClass('hidden');
    });

    it('should disable notify checkbox if category is primary', () => {
        render(
            <CategorySettingsItem
                loading={false}
                categoriesEnabled={true}
                updateDisplay={jest.fn()}
                updateNotify={jest.fn()}
                category={{
                    id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                    display: true,
                    notify: true,
                    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                }}
            />
        );

        const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}-notify`);
        expect(checkbox).toBeDisabled();
    });

    it('should disable notify checkbox if category display is off', () => {
        render(
            <CategorySettingsItem
                loading={false}
                categoriesEnabled={true}
                updateDisplay={jest.fn()}
                updateNotify={jest.fn()}
                category={{
                    id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    display: false,
                    notify: true,
                    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                }}
            />
        );

        const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-notify`);
        expect(checkbox).toBeDisabled();
    });

    it('should disable display toggle and notify checkbox while loading', () => {
        render(
            <CategorySettingsItem
                loading={true}
                categoriesEnabled={true}
                updateDisplay={jest.fn()}
                updateNotify={jest.fn()}
                category={{
                    id: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS,
                    display: true,
                    notify: true,
                    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
                }}
            />
        );

        const display = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-display`);
        expect(display).toBeDisabled();
        const checkbox = screen.getByTestId(`${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}-notify`);
        expect(checkbox).toBeDisabled();
    });
});
