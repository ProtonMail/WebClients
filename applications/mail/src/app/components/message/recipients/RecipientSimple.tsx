import { c } from 'ttag';

import type { ContactEditProps } from '@proton/components';

import type { RecipientOrGroup } from '../../../models/address';
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
        <div className="flex flex-nowrap items-center" data-testid="message-header:to">
            <RecipientType label={c('Label Recipient').t`To`}>
                <span className="flex" data-testid="recipients:partial-recipients-list">
                    {recipientsOrGroup.length
                        ? recipientsOrGroup.map((recipientOrGroup, index) => {
                              return (
                                  <span className="mr-2 flex" key={index}>
                                      <RecipientItem
                                          recipientOrGroup={recipientOrGroup}
                                          isLoading={isLoading}
                                          isOutside={isOutside}
                                          isRecipient={true}
                                          isExpanded={false}
                                          onContactDetails={onContactDetails}
                                          onContactEdit={onContactEdit}
                                          customDataTestId={`recipients:item-${
                                              recipientOrGroup.group
                                                  ? recipientOrGroup.group.group?.Name
                                                  : recipientOrGroup.recipient?.Address
                                          }`}
                                      />
                                      {index < recipientsOrGroup.length - 1 && (
                                          <span className="message-recipient-item-separator mr-0.5">,</span>
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
