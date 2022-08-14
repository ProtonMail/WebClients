import { ChangeEvent } from 'react';

import { c } from 'ttag';

import useSynchronizingState from '@proton/hooks/useSynchronizingState';
import { CALENDAR_APP_NAME, DRIVE_APP_NAME, MAIL_APP_NAME } from '@proton/shared/lib/constants';

import {
    Button,
    Checkbox,
    Form,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
} from '../../components';
import useEarlyAccess from '../../hooks/useEarlyAccess';

const EarlyAccessModal = ({ onClose, ...rest }: ModalProps) => {
    const earlyAccess = useEarlyAccess();

    const [earlyAccessEnabled, setEarlyAccessEnabled] = useSynchronizingState(earlyAccess.value);

    const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
        setEarlyAccessEnabled(e.target.checked);
    };

    const update = async () => {
        await earlyAccess.update(earlyAccessEnabled);
        window.location.reload();
    };

    return (
        <ModalTwo as={Form} onSubmit={update} onClose={onClose} {...rest}>
            <ModalTwoHeader title={c('Title').t`Beta Access`} />
            <ModalTwoContent>
                <p>
                    {c('Beta access description')
                        .t`Beta Access lets you use the beta version of ${MAIL_APP_NAME}, ${CALENDAR_APP_NAME}, and ${DRIVE_APP_NAME} before they are released to the public. This means you can be the first to try new products, get new updates, and use new features.`}
                </p>
                <p>{c('Beta access description').t`If you encounter issues, you can always disable Beta Access.`}</p>
                <div className="mb0-5 flex flex-align-items-center">
                    <label className="flex flex-nowrap" htmlFor="enable-early-access-checkbox">
                        <Checkbox
                            id="enable-early-access-checkbox"
                            checked={earlyAccessEnabled}
                            onChange={handleChange}
                            className="mr0-5"
                        />
                        {c('Label').t`Enable Beta Access`}
                    </label>
                </div>
                <p className="mb0-5 color-weak">
                    {c('Refresh on apply warning').t`Note: the service will reload after you click the Apply button.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button
                    type="submit"
                    color="norm"
                    loading={earlyAccess.loading}
                    disabled={earlyAccessEnabled === earlyAccess.value || !earlyAccess.canUpdate}
                >
                    {c('Action').t`Apply`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EarlyAccessModal;
