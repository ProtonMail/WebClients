import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { ButtonLike } from '@proton/atoms/Button/ButtonLike';
import { Href } from '@proton/atoms/Href/Href';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';

import { parseEmailLink } from '../../util/emailLinks';

interface Props extends ModalProps {
    url: string;
    onClose: () => void;
}

const EmailWarningModal = ({ url, onClose, ...modalProps }: Props) => {
    const email = parseEmailLink(url);
    const labels = {
        // translator: Confirmation dialog title asking whether to open a draft in the user's email app.
        openTitle: c('collider_2025:Title').t`Open email app?`,
        // translator: Error dialog title for an email link that cannot be opened safely.
        invalidTitle: c('collider_2025:Title').t`Invalid email link`,
        // translator: Shown in the To field when the email link contains no primary recipients.
        noRecipient: c('collider_2025:Info').t`No recipient specified`,
    };

    return (
        <ModalTwo {...modalProps} onClose={onClose} size={email ? 'medium' : 'small'}>
            <ModalTwoHeader title={email ? labels.openTitle : labels.invalidTitle} />
            <ModalTwoContent>
                {email ? (
                    <div className="flex flex-column flex-nowrap gap-4">
                        <p className="m-0">
                            {
                                // translator: Introduction to a preview of the recipients and message supplied by an email link; continuing opens a draft, not a sent email.
                                c('collider_2025:Info')
                                    .t`Your default email app will open a draft with these details. Review them before continuing.`
                            }
                        </p>

                        {/* Email details */}
                        <dl className="m-0 p-3 border rounded bg-weak">
                            <dt className="mb-1 text-sm text-bold color-primary">{
                                // translator: Email field label for the primary recipients.
                                c('collider_2025:Email recipient label').t`To`
                            }</dt>
                            <dd className="m-0 text-lg text-bold text-break" dir="auto">
                                {email.to.join(', ') || labels.noRecipient}
                            </dd>
                            {/* CC recipients */}
                            {email.cc.length > 0 && (
                                <>
                                    <dt className="mt-3 mb-1 text-sm text-bold color-primary">{
                                        // translator: Email field label for carbon-copy recipients, whose addresses are visible to other recipients.
                                        c('collider_2025:Email recipient label').t`CC`
                                    }</dt>
                                    <dd className="m-0 text-break" dir="auto">
                                        {email.cc.join(', ')}
                                    </dd>
                                </>
                            )}
                            {/* BCC recipients */}
                            {email.bcc.length > 0 && (
                                <>
                                    <dt className="mt-3 mb-1 text-sm text-bold color-primary">{
                                        // translator: Email field label for blind-carbon-copy recipients, whose addresses are hidden from other recipients.
                                        c('collider_2025:Email recipient label').t`BCC (hidden recipients)`
                                    }</dt>
                                    <dd className="m-0 text-break" dir="auto">
                                        {email.bcc.join(', ')}
                                    </dd>
                                </>
                            )}
                            {/* Subject */}
                            {email.subject && (
                                <>
                                    <dt className="mt-3 mb-1 text-sm text-bold color-primary">{
                                        // translator: Email field label for the title of the draft message.
                                        c('collider_2025:Email field label').t`Subject`
                                    }</dt>
                                    <dd className="m-0 text-break" dir="auto">
                                        {email.subject}
                                    </dd>
                                </>
                            )}
                        </dl>

                        {/* Prefilled message */}
                        {email.body && (
                            <div className="p-3 border rounded bg-weak">
                                <h3 className="m-0 mb-2 text-sm text-bold color-primary">
                                    {
                                        // translator: Heading above the email body supplied by the link, asking the user to review it before opening their email app.
                                        c('collider_2025:Action').t`Review prefilled message`
                                    }
                                </h3>
                                <div className="text-pre-wrap text-break" dir="auto">
                                    {email.body}
                                </div>
                            </div>
                        )}

                        {/* Safety information */}
                        <p className="m-0 mt-2 text-sm color-weak">
                            {
                                // translator: Safety warning to review all recipients and the supplied email body before handing the draft to an email app.
                                c('collider_2025:Disclaimer')
                                    .t`Email links can contain unexpected recipients or sensitive information. Check all recipients, including CC and BCC, and any prefilled message.`
                            }
                        </p>

                        {/* Privacy disclaimer */}
                        <p className="m-0 text-sm color-weak">
                            {
                                // translator: LUMO_SHORT_APP_NAME is the product name. Opening the link creates a draft in another app; it does not send email.
                                c('collider_2025:Disclaimer')
                                    .t`Continuing shares these details with your email app, which may save or sync the draft before you send it. ${LUMO_SHORT_APP_NAME} does not send the email. Only continue if you trust the recipients and are comfortable sharing this information.`
                            }
                        </p>
                    </div>
                ) : (
                    <p className="m-0">
                        {
                            // translator: Error explaining why the email link cannot be opened; its recipients or other supplied fields are invalid or unsupported.
                            c('collider_2025:Error')
                                .t`This email link contains invalid or unsupported details and cannot be opened safely.`
                        }
                    </p>
                )}
            </ModalTwoContent>
            <ModalTwoFooter>
                <div className="flex flex-column gap-3 w-full">
                    {email && (
                        <ButtonLike as={Href} href={email.href} color="norm" fullWidth onClick={onClose}>
                            {
                                // translator: Button that opens the reviewed draft in the default email app; it does not send the email.
                                c('collider_2025:Action').t`Open email app`
                            }
                        </ButtonLike>
                    )}
                    <Button fullWidth onClick={onClose}>{
                        // translator: Button that dismisses the email-link warning without opening the email app.
                        c('collider_2025:Action').t`Cancel`
                    }</Button>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default EmailWarningModal;
