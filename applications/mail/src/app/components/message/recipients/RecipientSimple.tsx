import { c } from 'ttag';

import { ContactEditProps } from '@proton/components/containers/contacts/edit/ContactEditModal';

import { RecipientOrGroup } from '../../../models/address';
import RecipientItem from './RecipientItem';
import RecipientType from './RecipientType';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    isLoading: boolean;
    isOutside?: boolean;
    onContactDetails: (contactID: string) => void;
    onContactEdit: (props: ContactEditProps) => void;
}

const RecipientSimple = ({ isLoading, recipientsOrGroup, isOutside, onContactDetails, onContactEdit }: Props) => {
    return (
        <div className="flex flex-nowrap flex-align-items-center" data-testid="message-header:to">
            <RecipientType label={c('Label Recipient').t`To`}>
                <span className="flex">
                    {recipientsOrGroup.length
                        ? recipientsOrGroup.map((recipientOrGroup, index) => {
                              return (
                                  <span className="mr0-5 flex" key={index}>
                                      <RecipientItem
                                          recipientOrGroup={recipientOrGroup}
                                          isLoading={isLoading}
                                          isOutside={isOutside}
                                          isRecipient={true}
                                          isExpanded={false}
                                          onContactDetails={onContactDetails}
                                          onContactEdit={onContactEdit}
                                      />
                                      {index < recipientsOrGroup.length - 1 && (
                                          <span className="message-recipient-item-separator mr0-2">,</span>
                                      )}
                                  </span>
                              );
                          })
                        : c('Label').t`Undisclosed Recipients`}
                </span>
            </RecipientType>
        </div>
    );
};

export default RecipientSimple;
