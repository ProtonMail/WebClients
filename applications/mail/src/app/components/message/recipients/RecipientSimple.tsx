import { c } from 'ttag';
import { HighlightMetadata } from '@proton/encrypted-search';

import RecipientType from './RecipientType';
import RecipientItem from './RecipientItem';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    isLoading: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    showAddress?: boolean;
    isOutside?: boolean;
}

const RecipientSimple = ({
    isLoading,
    recipientsOrGroup,
    highlightKeywords = false,
    highlightMetadata,
    showAddress,
    isOutside,
}: Props) => {
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
                                          highlightKeywords={highlightKeywords}
                                          highlightMetadata={highlightMetadata}
                                          showAddress={showAddress}
                                          isOutside={isOutside}
                                      />
                                      {index < recipientsOrGroup.length - 1 && (
                                          <span className="message-recipient-item-separator">,</span>
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
