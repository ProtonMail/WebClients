import { c } from 'ttag';

import { ButtonLike } from '@proton/atoms';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleHeader,
    CollapsibleHeaderIconButton,
    Icon,
    SettingsLink,
    useSecurityCheckup,
} from '@proton/components';

import Actions from './Actions';
import RecoveryMethods, { showRecoveryMethods } from './RecoveryMethods';

const RecommendedActions = () => {
    const { actions, furtherActions, securityState, backLink } = useSecurityCheckup();

    const actionsSet = new Set(actions);
    const filteredFurtherActions = furtherActions.filter((action) => !actionsSet.has(action));

    const prioritiseActions = actions.length;

    return (
        <div className="flex flex-column gap-8">
            {prioritiseActions ? (
                <div className="flex flex-column gap-2">
                    <h2 className="text-rg text-semibold">
                        {c('Safety review').t`Take action to secure your account`}
                    </h2>
                    <Actions actions={actions.length ? actions : filteredFurtherActions} />

                    {filteredFurtherActions.length ? (
                        <Collapsible className="mt-2">
                            <CollapsibleHeader
                                suffix={
                                    <CollapsibleHeaderIconButton size="small">
                                        <Icon className="color-weak" name="chevron-down" />
                                    </CollapsibleHeaderIconButton>
                                }
                                disableFullWidth
                                className="color-weak"
                                gap={1}
                            >
                                {c('Safety review').t`Show more`} ({filteredFurtherActions.length})
                            </CollapsibleHeader>
                            <CollapsibleContent className="mt-2">
                                <Actions actions={filteredFurtherActions} />
                            </CollapsibleContent>
                        </Collapsible>
                    ) : null}
                </div>
            ) : null}

            {showRecoveryMethods(securityState) ? (
                <div className="flex flex-column gap-2">
                    <h2 className="text-rg text-semibold">{c('Safety review').t`Your recovery methods`}</h2>
                    <RecoveryMethods />

                    <ButtonLike
                        className="mt-6 self-center"
                        as={SettingsLink}
                        path={'/recovery'}
                        app={backLink?.appName}
                        shape="ghost"
                        color="norm"
                        target="_self"
                    >
                        {c('Action').t`View recovery settings`}
                    </ButtonLike>
                </div>
            ) : null}

            {!prioritiseActions && filteredFurtherActions.length ? (
                <Collapsible>
                    <CollapsibleHeader
                        suffix={
                            <CollapsibleHeaderIconButton>
                                <Icon name="chevron-down" />
                            </CollapsibleHeaderIconButton>
                        }
                        disableFullWidth
                        className="color-weak"
                        gap={1}
                    >
                        {c('Safety review').t`Safeguard your account further`} ({filteredFurtherActions.length})
                    </CollapsibleHeader>
                    <CollapsibleContent>
                        <Actions actions={filteredFurtherActions} />
                    </CollapsibleContent>
                </Collapsible>
            ) : null}
        </div>
    );
};

export default RecommendedActions;
