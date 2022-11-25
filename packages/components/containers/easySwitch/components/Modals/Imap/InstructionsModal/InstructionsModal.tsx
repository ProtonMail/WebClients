import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { ImportType } from '@proton/shared/lib/interfaces/EasySwitch';

import { selectImapDraftProduct, selectImapDraftProvider } from '../../../../logic/draft/imapDraft/imapDraft.selector';
import { useEasySwitchSelector } from '../../../../logic/store';
import { ImportProvider } from '../../../../logic/types/shared.types';
import DefaultCalendarInstructions from './Instructions/default/DefaultCalendarInstructions';
import DefaultContactsInstructions from './Instructions/default/DefaultContactsInstructions';
import DefaultMailInstructions from './Instructions/default/DefaultMailInstructions';
import OutlookCalendarInstructions from './Instructions/outlook/OutlookCalendarInstructions';
import OutlookContactsInstructions from './Instructions/outlook/OutlookContactsInstructions';
import OutlookMailInstructions from './Instructions/outlook/OutlookMailInstructions';
import YahooCalendarInstructions from './Instructions/yahoo/YahooCalendarInstructions';
import YahooContactsInstructions from './Instructions/yahoo/YahooContactsInstructions';
import YahooMailInstructions from './Instructions/yahoo/YahooMailInstructions';

interface Props {
    onSubmit: () => void;
    onClose: () => void;
}

const { DEFAULT, YAHOO, OUTLOOK } = ImportProvider;

const InstructionsModal = ({ onSubmit, onClose }: Props) => {
    const product = useEasySwitchSelector(selectImapDraftProduct);
    const provider = useEasySwitchSelector(selectImapDraftProvider);

    const titleRenderer = () => {
        if (product === ImportType.MAIL) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import emails from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import emails from Outlook`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import emails from another service`;
            }
        }
        if (product === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import calendars from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import calendars from Outlook`;
            }
            if (provider === DEFAULT) {
                return c('Modal title').t`How to import calendars from another service`;
            }
        }
        if (product === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return c('Modal title').t`How to import contacts from Yahoo`;
            }
            if (provider === OUTLOOK) {
                return c('Modal title').t`How to import contacts from Outlook`;
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
            if (provider === OUTLOOK) {
                return <OutlookMailInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultMailInstructions />;
            }
        }
        if (product === ImportType.CALENDAR) {
            if (provider === YAHOO) {
                return <YahooCalendarInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookCalendarInstructions />;
            }
            if (provider === DEFAULT) {
                return <DefaultCalendarInstructions />;
            }
        }
        if (product === ImportType.CONTACTS) {
            if (provider === YAHOO) {
                return <YahooContactsInstructions />;
            }
            if (provider === OUTLOOK) {
                return <OutlookContactsInstructions />;
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
                <Button color="weak" onClick={onClose}>{c('Action').t`Close`}</Button>
                <Button color="norm" onClick={onSubmit}>{c('Action').t`Continue`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default InstructionsModal;
