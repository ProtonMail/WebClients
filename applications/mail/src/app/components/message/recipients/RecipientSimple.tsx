import { c } from 'ttag';

import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    isLoading: boolean;
    isOutside?: boolean;
}

const RecipientSimple = ({ isLoading, recipientsOrGroup, isOutside }: Props) => {
    return (
        <div className="flex flex-nowrap flex-align-items-center" data-testid="message-header:to">
            <RecipientType label={c('Label').t`To`}>
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
