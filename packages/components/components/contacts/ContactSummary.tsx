import { c } from 'ttag';
import { formatImage } from '@proton/shared/lib/helpers/image';
import { getPreferredValue } from '@proton/shared/lib/contacts/properties';
import { ContactProperties } from '@proton/shared/lib/interfaces/contacts';
import ContactImageSummary from './ContactImageSummary';
import './ContactSummary.scss';
import Tooltip from '../tooltip/Tooltip';
import { Button } from '../button';
import Icon from '../icon/Icon';
import { classnames } from '../../helpers';
import useActiveBreakpoint from '../../hooks/useActiveBreakpoint';

interface Props {
    properties: ContactProperties;
    onExport: () => void;
    onDelete: () => void;
    onEdit: (field?: string) => void;
    leftBlockWidth?: string;
    isPreview?: boolean;
    hasError?: boolean;
}

const ContactSummary = ({
    properties,
    onEdit,
    onDelete,
    onExport,
    isPreview,
    leftBlockWidth = 'w30',
    hasError = false,
}: Props) => {
    const { isNarrow } = useActiveBreakpoint();
    const photo = formatImage(getPreferredValue(properties, 'photo') as string);
    const name = getPreferredValue(properties, 'fn') as string;

    return (
        <div
            className={classnames([
                'contactsummary-container mt1 mb1',
                !isNarrow && 'flex flex-nowrap flex-align-items-center',
            ])}
        >
            <div
                className={classnames([
                    'text-center contactsummary-photo-container pt0-5 on-mobile-mb0-5 on-mobile-center',
                    leftBlockWidth,
                ])}
            >
                <ContactImageSummary photo={photo} name={name} />
            </div>
            <div className="contactsummary-contact-name-container pl2 on-mobile-pl0 flex-no-min-children flex-item-fluid">
                <h2
                    className="contactsummary-contact-name on-mobile-text-center mb0 flex-item-fluid on-mobile-mb1 text-bold text-ellipsis-two-lines"
                    title={name}
                >
                    {name}
                </h2>
                {!isPreview && (
                    <div className="contactsummary-action-buttons flex-item-noshrink on-mobile-text-center ">
                        {!hasError && (
                            <Tooltip title={c('Action').t`Export`}>
                                <Button
                                    color="weak"
                                    shape="outline"
                                    icon
                                    onClick={onExport}
                                    className="inline-flex ml0-5"
                                >
                                    <Icon name="arrow-up-from-screen" alt={c('Action').t`Export`} />
                                </Button>
                            </Tooltip>
                        )}

                        <Tooltip title={c('Action').t`Delete`}>
                            <Button color="weak" shape="outline" icon onClick={onDelete} className="inline-flex ml0-5">
                                <Icon name="trash" alt={c('Action').t`Delete`} />
                            </Button>
                        </Tooltip>

                        {!hasError && (
                            <Tooltip title={c('Action').t`Edit`}>
                                <Button
                                    icon
                                    shape="solid"
                                    color="norm"
                                    onClick={() => onEdit()}
                                    className="inline-flex ml0-5"
                                >
                                    <Icon name="pen" alt={c('Action').t`Edit`} />
                                </Button>
                            </Tooltip>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactSummary;
