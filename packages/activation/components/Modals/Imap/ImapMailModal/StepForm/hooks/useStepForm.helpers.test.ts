import { IMPORT_ERROR, ImportProvider } from '@proton/activation/interface';

import { getDefaultImap, getDefaultPort, validateStepForm } from './useStepForm.helpers';
import { StepFormBlur, StepFormState } from './useStepForm.interface';

describe('useStepForm', () => {
    it('Should validate step form without any issue', () => {
        const formValue: StepFormState = {
            emailAddress: 'testing@proton.ch',
            password: 'password',
            imap: 'imap.proton.me',
            port: '933',
        };

        const blurred: StepFormBlur = {
            emailAddress: false,
            password: false,
            imap: false,
            port: false,
        };

        const setErrors = jest.fn();
        const setHasErrors = jest.fn();

        validateStepForm(formValue, blurred, setErrors, setHasErrors);
        expect(setErrors).toHaveBeenCalledTimes(1);
        expect(setErrors).toHaveBeenCalledWith(undefined);
        expect(setHasErrors).toHaveBeenCalledTimes(1);
        expect(setHasErrors).toHaveBeenCalledWith(false);
    });

    it('Should have all possible errors', () => {
        const formValue: StepFormState = {
            emailAddress: '',
            password: '',
            imap: '',
            port: '',
        };

        const blurred: StepFormBlur = {
            emailAddress: true,
            password: true,
            imap: true,
            port: true,
        };

        const setErrors = jest.fn();
        const setHasErrors = jest.fn();

        validateStepForm(formValue, blurred, setErrors, setHasErrors);
        expect(setErrors).toHaveBeenCalledTimes(1);
        expect(setErrors).toHaveBeenCalledWith({
            emailAddress: 'Email address is required',
            password: 'Password is required',
            imap: 'IMAP server is required',
            port: 'Port is required',
        });
        expect(setHasErrors).toHaveBeenCalledTimes(1);
        expect(setHasErrors).toHaveBeenCalledWith(true);
    });

    it('Should test API code errors', () => {
        const formValue: StepFormState = {
            emailAddress: 'testing@proton.ch',
            password: 'password',
            imap: 'imap.proton.me',
            port: '933',
        };

        const blurred: StepFormBlur = {
            emailAddress: false,
            password: false,
            imap: false,
            port: false,
        };

        const setErrors = jest.fn();
        const setHasErrors = jest.fn();

        validateStepForm(
            formValue,
            blurred,
            setErrors,
            setHasErrors,
            IMPORT_ERROR.AUTHENTICATION_ERROR,
            'api error message'
        );
        expect(setErrors).toHaveBeenCalledTimes(1);
        expect(setErrors).toHaveBeenCalledWith({
            emailAddress: 'api error message',
            password: 'api error message',
        });

        validateStepForm(
            formValue,
            blurred,
            setErrors,
            setHasErrors,
            IMPORT_ERROR.IMAP_CONNECTION_ERROR,
            'api error message'
        );
        expect(setErrors).toHaveBeenCalledTimes(2);
        expect(setErrors).toHaveBeenCalledWith({
            imap: 'api error message',
            port: 'api error message',
        });

        validateStepForm(
            formValue,
            blurred,
            setErrors,
            setHasErrors,
            IMPORT_ERROR.ACCOUNT_DOES_NOT_EXIST,
            'api error message'
        );
        expect(setErrors).toHaveBeenCalledTimes(3);
        expect(setErrors).toHaveBeenCalledWith({
            imap: 'api error message',
            port: 'api error message',
        });
    });

    it('Should return default imap and port', () => {
        const defaultImap = getDefaultImap();
        const defaultPort = getDefaultPort();
        expect(defaultImap).toStrictEqual('');
        expect(defaultPort).toStrictEqual('');

        const googleImap = getDefaultImap(ImportProvider.GOOGLE);
        const googlePort = getDefaultPort(ImportProvider.GOOGLE);
        expect(googleImap).toStrictEqual('imap.gmail.com');
        expect(googlePort).toStrictEqual('993');

        const yahooImap = getDefaultImap(ImportProvider.YAHOO);
        const yahooPort = getDefaultPort(ImportProvider.YAHOO);
        expect(yahooImap).toStrictEqual('export.imap.mail.yahoo.com');
        expect(yahooPort).toStrictEqual('993');

        const outlookImap = getDefaultImap(ImportProvider.OUTLOOK);
        const outlookPort = getDefaultPort(ImportProvider.OUTLOOK);
        expect(outlookImap).toStrictEqual('outlook.office365.com');
        expect(outlookPort).toStrictEqual('993');
    });
});
