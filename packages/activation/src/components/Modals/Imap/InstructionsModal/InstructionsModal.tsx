import { c } from 'ttag';

import { ImportProvider, ImportType } from '@proton/activation/src/interface';
import {
    selectImapDraftProduct,
    selectImapDraftProvider,
} from '@proton/activation/src/logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchSelector } from '@proton/activation/src/logic/store';
import { Button } from '@proton/atoms';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';

import DefaultCalendarInstructions from './Instructions/default/DefaultCalendarInstructions';
import DefaultContactsInstructions from './Instructions/default/DefaultContactsInstructions';
import DefaultMailInstructions from './Instructions/default/DefaultMailInstructions';
import YahooCalendarInstructions from './Instructions/yahoo/YahooCalendarInstructions';
import YahooContactsInstructions from './Instructions/yahoo/YahooContactsInstructions';
import YahooMailInstructions from './Instructions/yahoo/YahooMailInstructions';

interface Props {
    onSubmit: () => void;
    onClose: () => void;
}

const { DEFAULT, YAHOO } = ImportProvider;

const InstructionsModal = ({ onSubmit, onClose }: Props) => {
    const product = useEasySwitchSelector(selectImapDraftProduct);
    const provider = useEasySwitchSelector(selectImapDraftProvider);

    const titleRenderer = () => {
        if (product === ImportType.MAIL) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import emails from Yahoo`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import emails from another service`;
            }
        }
        if (product === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import calendars from Yahoo`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import calendars from another service`;
            }
        }
        if (product === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import contacts from Yahoo`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import contacts from another service`;
            }
        }
    };

    const instructionsRenderer = () => {
        if (product === ImportType.MAIL) {
            if (provider === YAHOO) {
                return <YahooMailInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultMailInstructions />;
            }
        }
        if (product === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return <YahooCalendarInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultCalendarInstructions />;
            }
        }
        if (product === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return <YahooContactsInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultContactsInstructions />;
            }
        }

        return null;
    };

    return (
        <ModalTwo key="easy-switch-instruction-modal" className="easy-switch-modal" open onClose={onClose}>
            <ModalTwoHeader title={titleRenderer()} />
            <ModalTwoContent>{instructionsRenderer()}</ModalTwoContent>
            <ModalTwoFooter>
                <Button color="weak" onClick={onClose} data-testid="Instruction:close">{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={onSubmit} data-testid="Instruction:continue">{c('Action')
                    .t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InstructionsModal;
