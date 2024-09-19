import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components';
import {
    Form,
    InputFieldTwo,
    ModalTwo as Modal,
    ModalTwoContent as ModalContent,
    ModalTwoFooter as ModalFooter,
    ModalTwoHeader as ModalHeader,
    SelectTwo,
    TextAreaTwo,
    useApi,
    useConfig,
    useErrorHandler,
    useFormErrors,
    useUser,
} from '@proton/components';
import Option from '@proton/components/components/option/Option';
import Prompt from '@proton/components/components/prompt/Prompt';
import { getClientName } from '@proton/components/helpers/report';
import { reportCancelPlan } from '@proton/shared/lib/api/reports';
import { getBrowser, getOS } from '@proton/shared/lib/helpers/browser';
import { requiredValidator } from '@proton/shared/lib/helpers/formValidators';
import noop from '@proton/utils/noop';

enum STEP {
    FORM,
    COMPLETED,
}

enum REASON {
    TOO_EXPENSIVE,
    MISSING_FEATURE,
    ANOTHER_SERVICE,
    OTHER,
}

const { TOO_EXPENSIVE, MISSING_FEATURE, ANOTHER_SERVICE, OTHER } = REASON;

const reasons: { [key in REASON]: { tag: string; label: string } } = {
    [TOO_EXPENSIVE]: {
        tag: 'tag_1',
        label: c('VPN B2B cancellation reason').t`It’s too expensive`,
    },
    [MISSING_FEATURE]: {
        tag: 'tag_2',
        label: c('VPN B2B cancellation reason').t`It’s missing a key feature`,
    },
    [ANOTHER_SERVICE]: {
        tag: 'tag_3',
        label: c('VPN B2B cancellation reason').t`I found another service that I like better`,
    },
    [OTHER]: {
        tag: 'tag_4',
        label: c('VPN B2B cancellation reason').t`Other`,
    },
};

export interface Props extends ModalProps {}

const CancelB2bSubscriptionModal = ({ open, onClose, ...rest }: Props) => {
    const api = useApi();
    const [user] = useUser();
    const { APP_NAME, APP_VERSION, CLIENT_TYPE } = useConfig();
    const errorHandler = useErrorHandler();

    const [step, setStep] = useState(STEP.FORM);
    const [loading, setLoading] = useState(false);

    const [selectedReason, setSelectedReason] = useState<REASON>();
    const [feedback, setFeedback] = useState('');

    const { validator, onFormSubmit } = useFormErrors();

    if (step === STEP.COMPLETED) {
        return (
            <Prompt
                open={open}
                onClose={onClose}
                title={c('Title').t`Request sent`}
                buttons={[<Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>]}
                {...rest}
            >
                {c('Info').t`We'll get back to you shortly.`}
            </Prompt>
        );
    }

    const handleSubmit = async () => {
        if (!onFormSubmit() || selectedReason === undefined) {
            return;
        }

        setLoading(true);

        try {
            const reason = reasons[selectedReason];

            const browser = getBrowser();
            const os = getOS();
            const client = getClientName(APP_NAME);

            await api(
                reportCancelPlan({
                    Reason: reason.label,
                    Message: feedback,
                    Email: user.Email,
                    OS: os.name,
                    OSVersion: os.version,
                    Browser: browser.name,
                    BrowserVersion: browser.version,
                    Client: client,
                    ClientVersion: APP_VERSION,
                    ClientType: CLIENT_TYPE,
                    Tags: [reason.tag],
                })
            );

            setStep(STEP.COMPLETED);
        } catch (error) {
            errorHandler(error);
            setLoading(false);
        }
    };

    return (
        <Modal as={Form} open={open} onClose={loading ? noop : onClose} onSubmit={handleSubmit} {...rest}>
            <ModalHeader title={c('Title').t`Contact us`} />
            <ModalContent>
                <InputFieldTwo
                    as={SelectTwo}
                    label={c('Label').t`Why would you like to cancel?`}
                    placeholder={c('Placeholder').t`Please select the main reason`}
                    id="reason"
                    value={selectedReason}
                    onValue={(value: unknown) => {
                        setSelectedReason(value as REASON);
                    }}
                    error={validator([requiredValidator(selectedReason)])}
                    disabled={loading}
                >
                    {Object.entries(reasons).map(([value, { label }]) => (
                        <Option title={label} value={value} key={value} />
                    ))}
                </InputFieldTwo>
                <InputFieldTwo
                    as={TextAreaTwo}
                    id="feedback"
                    label={c('Label').t`Please share any feedback to help us improve.`}
                    value={feedback}
                    onValue={setFeedback}
                    error={validator([requiredValidator(feedback)])}
                    rows={5}
                    disabled={loading}
                />
            </ModalContent>
            <ModalFooter>
                <Button onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button loading={loading} type="submit" color="norm">
                    {c('Action').t`Submit`}
                </Button>
            </ModalFooter>
        </Modal>
    );
};

export default CancelB2bSubscriptionModal;
