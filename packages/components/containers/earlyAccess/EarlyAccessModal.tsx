import React from 'react';
import { c } from 'ttag';

import { Button, Checkbox, FormModal } from '../../components';
import useEarlyAccess from '../../hooks/useEarlyAccess';
import useSynchronizingState from '../../hooks/useSynchronizingState';

const EarlyAccessModal = (props: { onClose?: () => void }) => {
    const earlyAccess = useEarlyAccess();

    const [earlyAccessEnabled, setEarlyAccessEnabled] = useSynchronizingState(earlyAccess.value);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setEarlyAccessEnabled(e.target.checked);
    };

    const update = async () => {
        await earlyAccess.update(earlyAccessEnabled);
        window.location.reload();
    };

    return (
        <FormModal
            {...props}
            intermediate
            close={c('Action').t`Cancel`}
            submit={
                <Button
                    type="submit"
                    color="norm"
                    loading={earlyAccess.loading}
                    disabled={earlyAccessEnabled === earlyAccess.value || !earlyAccess.canUpdate}
                >
                    {c('Action').t`Apply`}
                </Button>
            }
            loading={earlyAccess.loading}
            onSubmit={update}
        >
            <div className="h2">{c('Title').t`Beta Access`}</div>
            <p>
                {c('Beta access description')
                    .t`Beta Access lets you use the beta version of ProtonMail, Proton Calendar, and Proton Drive before they are released to the public. This means you can be the first to try new products, get new updates, and use new features.`}
            </p>
            <p>
                {c('Beta access description')
                    .t`If you encounter issues, you can always disable Beta Access.`}
            </p>
            <div className="mb0-5 flex flex-align-items-center">
                <label className="flex flex-nowrap" htmlFor="enable-early-access-checkbox">
                    <Checkbox
                        id="enable-early-access-checkbox"
                        checked={earlyAccessEnabled}
                        onChange={handleChange}
                        className="mr0-5"
                    />
                    {c('Label').t`Enable Beta access`}
                </label>
            </div>
            <p className="mb0-5 color-weak">
                {c('Refresh on apply warning')
                    .t`Note: the service will reload after you click the Apply button.`}
            </p>
        </FormModal>
    );
};

export default EarlyAccessModal;
