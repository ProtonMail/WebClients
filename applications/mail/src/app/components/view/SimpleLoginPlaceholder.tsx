import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useModalState } from '@proton/components/components';
import { TelemetrySimpleLoginEvents } from '@proton/shared/lib/api/telemetry';
import connectSimpleLoginSvg from '@proton/styles/assets/img/illustrations/connect-simple-login.svg';

import { useSimpleLoginTelemetry } from '../../hooks/simpleLogin/useSimpleLoginTelemetry';
import SimpleLoginModal from '../simpleLogin/SimpleLoginModal';

const SimpleLoginPlaceholder = () => {
    const { handleSendTelemetryData } = useSimpleLoginTelemetry();
    const [simpleLoginModalProps, setSimpleLoginModalOpen, renderSimpleLoginModal] = useModalState();

    const handleSimpleLoginModal = () => {
        // We need to send a telemetry request when the user clicks on the mask my email button
        handleSendTelemetryData(TelemetrySimpleLoginEvents.simplelogin_modal_view, {}, true);

        setSimpleLoginModalOpen(true);
    };

    return (
        <>
            <div className="mb-8">
                <img
                    src={connectSimpleLoginSvg}
                    alt={c('Alternative text for conversation image').t`Conversation`}
                    className="hauto"
                />
            </div>
            <h2 className="text-bold">{c('Title').t`Don't give spam a chance`}</h2>
            <p className="mx-auto text-center max-w-custom" style={{ '--max-w-custom': '30em' }}>
                {c('Info')
                    .t`They can't spam you if they don't know your email address. Protect your inbox with hide-my-email aliases.`}
            </p>
            <Button onClick={() => handleSimpleLoginModal()} color="norm" shape="outline">
                {c('Action').t`Hide my email`}
            </Button>
            {renderSimpleLoginModal && <SimpleLoginModal {...simpleLoginModalProps} />}
        </>
    );
};

export default SimpleLoginPlaceholder;
