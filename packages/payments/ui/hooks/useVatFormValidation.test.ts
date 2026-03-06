import { act } from 'react';

import { renderHook } from '@testing-library/react';

import useFlag from '@proton/unleash/useFlag';

import { type VatFormFields, getVatFormErrors, useVatFormValidation } from './useVatFormValidation';

jest.mock('@proton/unleash/useFlag', () => ({
    __esModule: true,
    default: jest.fn().mockReturnValue(true),
}));

const mockUseFlag = useFlag as jest.MockedFunction<typeof useFlag>;

const emptyFields: VatFormFields = {
    CountryCode: 'US',
    State: '',
    ZipCode: '',
    VatId: '',
    Company: '',
    FirstName: '',
    LastName: '',
    Address: '',
    City: '',
};

const withVat = (overrides: Partial<VatFormFields> = {}): VatFormFields => ({
    ...emptyFields,
    CountryCode: 'DE',
    VatId: 'DE123456788',
    ...overrides,
});

describe('getVatFormErrors', () => {
    describe('no VAT number', () => {
        it('should return no errors when VAT number is empty', () => {
            const errors = getVatFormErrors(emptyFields, true);

            expect(errors.errorMessages.VatId).toBe('');
            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
        });

        it('should return no errors regardless of other fields when VAT is empty', () => {
            const errors = getVatFormErrors(
                {
                    ...emptyFields,
                    Company: 'Acme',
                    FirstName: 'John',
                },
                true
            );

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
        });
    });

    describe('showExtendedBillingAddressForm = false', () => {
        it('should return no errors besides vatNumber when VAT is provided', () => {
            const errors = getVatFormErrors(withVat(), false);

            expect(errors.errorMessages.VatId).toBe('');
            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
        });

        it('should skip extended validation even when fields are partially filled', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme' }), false);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
        });

        it('should skip name pairing validation', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John' }), false);

            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
        });

        it('should return no errors when VAT is empty regardless of flag', () => {
            const errors = getVatFormErrors(emptyFields, false);

            expect(errors.hasErrors).toBe(false);
        });
    });

    describe('at least one path required', () => {
        it('should show company, address and city errors when nothing is filled', () => {
            const errors = getVatFormErrors(withVat(), true);

            expect(errors.errorMessages.Company).toBeTruthy();
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should not show company error when company is filled', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme' }), true);

            expect(errors.errorMessages.Company).toBe('');
        });

        it('should not show company error when both first and last name are filled', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John', LastName: 'Doe' }), true);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should not show "at least one path" error when name pair error is already shown', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John' }), true);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.LastName).toBeTruthy();
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should not show "at least one path" error when only last name is provided', () => {
            const errors = getVatFormErrors(withVat({ LastName: 'Doe' }), true);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.FirstName).toBeTruthy();
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should show company error when only address is filled (no path started)', () => {
            const errors = getVatFormErrors(withVat({ Address: 'Main St' }), true);

            expect(errors.errorMessages.Company).toBeTruthy();
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should show company error when only city is filled (no path started)', () => {
            const errors = getVatFormErrors(withVat({ City: 'Berlin' }), true);

            expect(errors.errorMessages.Company).toBeTruthy();
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBe('');
        });
    });

    describe('company requires address and city', () => {
        it('should require address when company is provided', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme', City: 'Berlin' }), true);

            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBe('');
        });

        it('should require city when company is provided', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme', Address: 'Main St' }), true);

            expect(errors.errorMessages.City).toBeTruthy();
            expect(errors.errorMessages.Address).toBe('');
        });

        it('should require both address and city when company is provided alone', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme' }), true);

            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
            expect(errors.errorMessages.Company).toBe('');
        });

        it('should have no errors when company + address + city are all provided', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme', Address: 'Main St', City: 'Berlin' }), true);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
        });

        it('should still require address and city when company is provided alongside full name', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme', FirstName: 'John', LastName: 'Doe' }), true);

            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
        });
    });

    describe('first name and last name pairing', () => {
        it('should require last name when only first name is provided', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John' }), true);

            expect(errors.errorMessages.LastName).toBeTruthy();
            expect(errors.errorMessages.FirstName).toBe('');
        });

        it('should require first name when only last name is provided', () => {
            const errors = getVatFormErrors(withVat({ LastName: 'Doe' }), true);

            expect(errors.errorMessages.FirstName).toBeTruthy();
            expect(errors.errorMessages.LastName).toBe('');
        });

        it('should have no name errors when both first and last name are provided', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John', LastName: 'Doe' }), true);

            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
        });
    });

    describe('address and city are always required when VAT is present', () => {
        it('should require address and city even when only first and last name are provided', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John', LastName: 'Doe' }), true);

            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should still require city when address is provided with name path', () => {
            const errors = getVatFormErrors(withVat({ FirstName: 'John', LastName: 'Doe', Address: 'Main St' }), true);

            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBeTruthy();
        });

        it('should have no errors when name path is complete with address and city', () => {
            const errors = getVatFormErrors(
                withVat({ FirstName: 'John', LastName: 'Doe', Address: 'Main St', City: 'Berlin' }),
                true
            );

            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBe('');
            expect(errors.errorMessages.Address).toBe('');
            expect(errors.errorMessages.City).toBe('');
            expect(errors.errorMessages.Company).toBe('');
        });
    });

    describe('combined scenarios', () => {
        it('should show all completion errors when company + first name but no last name, address, city', () => {
            const errors = getVatFormErrors(withVat({ Company: 'Acme', FirstName: 'John' }), true);

            expect(errors.errorMessages.Company).toBe('');
            expect(errors.errorMessages.Address).toBeTruthy();
            expect(errors.errorMessages.City).toBeTruthy();
            expect(errors.errorMessages.FirstName).toBe('');
            expect(errors.errorMessages.LastName).toBeTruthy();
        });

        it('should be fully valid with company + address + city + first + last name', () => {
            const errors = getVatFormErrors(
                withVat({
                    Company: 'Acme',
                    Address: 'Main St',
                    City: 'Berlin',
                    FirstName: 'John',
                    LastName: 'Doe',
                }),
                true
            );

            expect(errors.hasErrors).toBe(false);
        });
    });
});

describe('useVatFormValidation', () => {
    beforeEach(() => {
        mockUseFlag.mockReturnValue(true);
    });

    describe('error visibility', () => {
        it('should not show errors initially', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            expect(result.current.errors.errorMessages.Company).toBe('');
        });

        it('should show errors after form blur when VAT is present', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            act(() => {
                result.current.handleFormBlur({
                    relatedTarget: document.body,
                } as unknown as React.FocusEvent);
            });

            expect(result.current.errors.errorMessages.Company).toBeTruthy();
        });

        it('should not show errors after blur when VAT is empty', () => {
            const { result } = renderHook(() => useVatFormValidation(emptyFields));

            act(() => {
                result.current.handleFormBlur({
                    relatedTarget: document.body,
                } as unknown as React.FocusEvent);
            });

            expect(result.current.errors.errorMessages.Company).toBe('');
        });

        it('should reset errors when VAT is cleared', () => {
            const { result, rerender } = renderHook((fields: VatFormFields) => useVatFormValidation(fields), {
                initialProps: withVat(),
            });

            act(() => {
                result.current.handleFormBlur({
                    relatedTarget: document.body,
                } as unknown as React.FocusEvent);
            });

            expect(result.current.errors.errorMessages.Company).toBeTruthy();

            rerender(emptyFields);

            expect(result.current.errors.errorMessages.Company).toBe('');
        });

        it('should reset errors when collapsed', () => {
            const { result, rerender } = renderHook(
                ({ fields, collapsed }: { fields: VatFormFields; collapsed: boolean }) =>
                    useVatFormValidation(fields, { collapsed }),
                { initialProps: { fields: withVat(), collapsed: false } }
            );

            act(() => {
                result.current.handleFormBlur({
                    relatedTarget: document.body,
                } as unknown as React.FocusEvent);
            });

            expect(result.current.errors.errorMessages.Company).toBeTruthy();

            rerender({ fields: withVat(), collapsed: true });

            expect(result.current.errors.errorMessages.Company).toBe('');
        });
    });

    describe('isValid', () => {
        it('should be true when no VAT number is provided', () => {
            const { result } = renderHook(() => useVatFormValidation(emptyFields));

            expect(result.current.isValid).toBe(true);
        });

        it('should be false when VAT is provided but nothing else', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            expect(result.current.isValid).toBe(false);
        });

        it('should be true when company path is complete', () => {
            const { result } = renderHook(() =>
                useVatFormValidation(withVat({ Company: 'Acme', Address: 'Main St', City: 'Berlin' }))
            );

            expect(result.current.isValid).toBe(true);
        });

        it('should be true when name path is complete with address and city', () => {
            const { result } = renderHook(() =>
                useVatFormValidation(
                    withVat({ FirstName: 'John', LastName: 'Doe', Address: 'Main St', City: 'Berlin' })
                )
            );

            expect(result.current.isValid).toBe(true);
        });

        it('should be false when company is provided without address', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat({ Company: 'Acme', City: 'Berlin' })));

            expect(result.current.isValid).toBe(false);
        });

        it('should reflect validity regardless of showErrors state', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            expect(result.current.isValid).toBe(false);
            expect(result.current.errors.errorMessages.Company).toBe('');
        });
    });

    describe('when showExtendedBillingAddressForm flag is off', () => {
        beforeEach(() => {
            mockUseFlag.mockReturnValue(false);
        });

        it('should be valid when VAT is provided without any other fields', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            expect(result.current.isValid).toBe(true);
        });

        it('should not show company error after blur', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat()));

            act(() => {
                result.current.handleFormBlur({
                    relatedTarget: document.body,
                } as unknown as React.FocusEvent);
            });

            expect(result.current.errors.errorMessages.Company).toBe('');
            expect(result.current.errors.errorMessages.FirstName).toBe('');
            expect(result.current.errors.errorMessages.LastName).toBe('');
            expect(result.current.errors.errorMessages.Address).toBe('');
            expect(result.current.errors.errorMessages.City).toBe('');
        });

        it('should still be valid when no VAT is provided', () => {
            const { result } = renderHook(() => useVatFormValidation(emptyFields));

            expect(result.current.isValid).toBe(true);
        });

        it('should skip extended validation even with partial fields', () => {
            const { result } = renderHook(() => useVatFormValidation(withVat({ Company: 'Acme' })));

            expect(result.current.isValid).toBe(true);
        });
    });
});
