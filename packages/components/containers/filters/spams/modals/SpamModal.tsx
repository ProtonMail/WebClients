import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button, Input } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import { validateEmailAddress } from '@proton/shared/lib/helpers/email';
import { isDomain } from '@proton/shared/lib/helpers/validators';

import type { ModalProps } from '../../../../components';
import { Label, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader, Radio } from '../../../../components';
import Field from '../../../../components/container/Field';
import Row from '../../../../components/container/Row';
import type { SpamLocation } from '../Spams.interfaces';

export type SpamMode = 'email' | 'domain';

interface Props {
    type: SpamLocation;
    onAdd: (mode: SpamMode, name: string) => void;
    modalProps: ModalProps;
}

const SpamModal = ({ type, onAdd, modalProps }: Props) => {
    const I18N: Record<SpamLocation, string> = {
        BLOCKED: c('Title').t`Add to block list`,
        NON_SPAM: c('Title').t`Add to allow list`,
        SPAM: c('Title').t`Add to spam list`,
    };

    const inputElementRef = useRef<HTMLInputElement>(null);
    const [mode, setMode] = useState<SpamMode>('email');
    const [email, setEmail] = useState('');
    const [domain, setDomain] = useState('');
    const [error, setError] = useState('');
    const [isValid, setIsValid] = useState(false);

    const { onClose } = modalProps;

    const handleSubmit = () => {
        onClose?.();
        onAdd(mode, domain || email);
    };

    useEffect(() => {
        setDomain('');
        setEmail('');
        setIsValid(false);
        inputElementRef.current?.focus();
    }, [mode]);

    useEffect(() => {
        if ((mode === 'email' && email === '') || (mode === 'domain' && domain === '')) {
            setError('');
            setIsValid(false);
        }
        if (mode === 'email' && email !== '') {
            const isValidEmail = email && validateEmailAddress(email);
            if (isValidEmail) {
                setError('');
                setIsValid(true);
            } else {
                setError(c('Error').t`Invalid email address`);
                setIsValid(false);
            }
        }
        if (mode === 'domain' && domain !== '') {
            const isValidDomain = domain && isDomain(domain);
            if (isValidDomain) {
                setError('');
                setIsValid(true);
            } else {
                setError(c('Error').t`Invalid domain`);
                setIsValid(false);
            }
        }
    }, [email, domain]);

    return (
        <ModalTwo size="large" as={Form} onSubmit={handleSubmit} {...modalProps} data-testid="spam-modal">
            <ModalTwoHeader title={I18N[type]} />
            <ModalTwoContent>
                <Row>
                    <Label id="descAddressType">{c('Label').t`Address type`}</Label>
                    <Field className="mt-1 pt-0.5">
                        <Radio
                            id="email-mode"
                            checked={mode === 'email'}
                            onChange={() => setMode('email')}
                            className="mr-4"
                            name="filterMode"
                            aria-describedby="descAddressType"
                        >
                            {c('Label').t`Email`}
                        </Radio>
                        <Radio
                            id="domain-mode"
                            checked={mode === 'domain'}
                            onChange={() => setMode('domain')}
                            name="filterMode"
                            aria-describedby="descAddressType"
                        >
                            {c('Label').t`Domain`}
                        </Radio>
                    </Field>
                </Row>
                <Row>
                    <Label htmlFor={`${mode}Input`}>
                        {mode === 'email' ? c('Label').t`Email` : c('Label').t`Domain`}
                    </Label>
                    <div>
                        <Input
                            id={`${mode}Input`}
                            ref={inputElementRef}
                            value={mode === 'email' ? email : domain}
                            type={mode === 'email' ? 'email' : 'text'}
                            placeholder={
                                mode === 'email'
                                    ? c('Placeholder').t`example@domain.com`
                                    : c('Placeholder').t`domain.com`
                            }
                            onChange={(e) => (mode === 'email' ? setEmail(e.target.value) : setDomain(e.target.value))}
                            error={error}
                        />
                    </div>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>
                <Button color="norm" type="submit" disabled={!isValid}>
                    {mode === 'email' ? c('Action').t`Add address` : c('Action').t`Add domain`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default SpamModal;
