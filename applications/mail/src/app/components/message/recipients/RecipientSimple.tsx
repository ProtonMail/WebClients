import { c } from 'ttag';
import { HighlightMetadata } from '../../../models/encryptedSearch';
import { RecipientOrGroup } from '../../../models/address';

interface Props {
    recipientsOrGroup: RecipientOrGroup[];
    isLoading?: boolean;
    highlightKeywords?: boolean;
    highlightMetadata?: HighlightMetadata;
    getRecipientOrGroupLabel?: ({ recipient, group }: RecipientOrGroup, detailed?: boolean) => string;
}

const RecipientSimple = ({
    recipientsOrGroup,
    isLoading,
    highlightKeywords,
    highlightMetadata,
    getRecipientOrGroupLabel,
}: Props) => {
    return (
        <div className="flex flex-nowrap" data-testid="message-header:to">
            <span className="message-header-to container-to pl0-5">{!isLoading && c('Label').t`To:`}</span>
            <span className="message-header-contact text-ellipsis">
                {!isLoading && (
                    <>
                        {recipientsOrGroup.length
                            ? recipientsOrGroup.map((recipientOrGroup, index) => {
                                  const label = getRecipientOrGroupLabel
                                      ? getRecipientOrGroupLabel(recipientOrGroup)
                                      : recipientOrGroup.recipient?.Address;
                                  const highlightedLabel =
                                      !!label && highlightKeywords && highlightMetadata
                                          ? highlightMetadata(label).resultJSX
                                          : label;

                                  return (
                                      <span
                                          key={index} // eslint-disable-line react/no-array-index-key
                                          title={label}
                                      >
                                          <span>{highlightedLabel}</span>
                                          {index < recipientsOrGroup.length - 1 && ', '}
                                      </span>
                                  );
                              })
                            : c('Label').t`Undisclosed Recipients`}
                    </>
                )}
            </span>
        </div>
    );
};

export default RecipientSimple;
