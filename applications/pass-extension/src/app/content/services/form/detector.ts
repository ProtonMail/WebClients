import { MAX_MAX_DETECTION_TIME, MIN_MAX_DETECTION_TIME } from 'proton-pass-extension/app/content/constants.static';
import type { CSFeatures } from 'proton-pass-extension/app/content/context/types';
import type { DetectedField, DetectedForm } from 'proton-pass-extension/app/content/types';
import { selectNodeFromPath } from 'proton-pass-extension/app/content/utils/nodes';
import { contentScriptMessage, sendMessage } from 'proton-pass-extension/lib/message/send-message';
import { WorkerMessageType } from 'proton-pass-extension/types/messages';

import type { FieldType } from '@proton/pass/fathom';
import {
    FormType,
    clearDetectionCache,
    fieldTypes,
    flagOverride,
    flagSubtreeAsIgnored,
    formTypes,
    getTypeScore,
    prepass,
    rulesetMaker,
    shadowPiercingContains,
    shouldRunClassifier,
} from '@proton/pass/fathom';
import type { Fnode } from '@proton/pass/fathom/fathom';
import type { DetectionRulesMatch } from '@proton/pass/lib/extension/rules/types';
import { type MaybeNull } from '@proton/pass/types';
import { compareDomNodes } from '@proton/pass/utils/dom/sort';
import { prop } from '@proton/pass/utils/fp/lens';
import { truthy } from '@proton/pass/utils/fp/predicates';
import { liftSort } from '@proton/pass/utils/fp/sort';
import { logger } from '@proton/pass/utils/logger';
import { withMaxExecutionTime } from '@proton/pass/utils/time/performance';
import { wait } from '@proton/shared/lib/helpers/promise';
import noop from '@proton/utils/noop';

const ruleset = rulesetMaker();
const NOOP_EL = document.createElement('form');
const DETECTION_TIE_TRESHOLD = 0.01;

type DetectorState = { rules: MaybeNull<DetectionRulesMatch> };
type BoundRuleset = ReturnType<typeof ruleset.against>;
type PredictionResult<T extends string> = { fnode: Fnode; type: T; score: number };
type PredictionBestSelector<T extends string> = (
    candidates: [PredictionResult<T>, PredictionResult<T>]
) => PredictionResult<T>;

const getPredictionsFor = <T extends string>(
    boundRuleset: BoundRuleset,
    options: {
        type: 'form' | 'field';
        subTypes: T[];
        selectBest: PredictionBestSelector<T>;
    }
): PredictionResult<T>[] => {
    /* The following `get` call is necessary to trigger the
     * `allThrough` effect which will flag the nodes */
    boundRuleset.get(options.type);

    const predictions = options.subTypes.reduce<Map<Fnode, PredictionResult<T>>>((results, subType) => {
        const fnodes: Fnode[] = boundRuleset.get(subType);
        fnodes.forEach((fnode) => {
            const score = getTypeScore(fnode, subType);
            const candidate = { type: subType, fnode, score };
            const bestSoFar = results.get(fnode);

            if (!bestSoFar) results.set(fnode, candidate);
            else results.set(fnode, options.selectBest([candidate, bestSoFar]));
        });

        return results;
    }, new Map());

    return Array.from(predictions.values());
};

/* cluster each predicted field by its parent predicted
 * form. If no such form exists, keep a reference to all
 * "dangling" fields in order to process them accordingly */
const groupFields = (
    formPredictions: PredictionResult<FormType>[],
    fieldPredictions: PredictionResult<FieldType>[]
) => {
    const grouping = new WeakMap<HTMLElement, DetectedField[]>();

    fieldPredictions.forEach(({ fnode: fieldFNode, type: fieldType }) => {
        const field = fieldFNode.element as HTMLInputElement;
        const parent: HTMLElement =
            formPredictions.find(({ fnode: formFNode }) => {
                const form = formFNode.element;
                return shadowPiercingContains(form, field);
            })?.fnode.element ?? NOOP_EL;

        const entry = grouping?.get(parent) ?? [];
        entry.push({ fieldType, field });

        return grouping.set(parent, entry);
    });

    return grouping;
};

const selectBest: PredictionBestSelector<any> = ([a, b]) => (a.score > b.score ? a : b);

/* if we have a tie with a login form : always prefer the login type
 * as it is less deceptive for the user. FIXME: on tie between login &
 * register, we should query the autofillable candidates and adapt the
 * form-type accordingly. In the case of a close tie between a register
 * and a password-change form, pick password-change for autosave.  */
const selectBestForm: PredictionBestSelector<FormType> = (candidates) => {
    const pwChange = candidates.find(({ type }) => type === FormType.PASSWORD_CHANGE);
    const login = candidates.find(({ type }) => type === FormType.LOGIN);
    const register = candidates.find(({ type }) => type === FormType.REGISTER);
    const delta = Math.abs(candidates[0].score - candidates[1].score);

    if (pwChange && register) return delta <= DETECTION_TIE_TRESHOLD ? pwChange : register;
    if (!login) return selectBest(candidates) as PredictionResult<FormType>;
    else return login;
};

type DetectionRunnerOptions = {
    excludedFieldTypes?: FieldType[];
    onBottleneck: (data: { detectionTime: number; hostname: string }) => void;
};

/* Runs the fathom detection and returns a form handle for each detected form.. */
const createDetectionRunner =
    (ruleset: ReturnType<typeof rulesetMaker>, doc: Document) =>
    ({ excludedFieldTypes = [], onBottleneck }: DetectionRunnerOptions): DetectedForm[] => {
        const [formPredictions, fieldPredictions] = withMaxExecutionTime(
            (): [PredictionResult<FormType>[], PredictionResult<FieldType>[]] => {
                const boundRuleset = ruleset.against(doc.body);
                return [
                    getPredictionsFor<FormType>(boundRuleset, {
                        type: 'form',
                        subTypes: formTypes,
                        selectBest: selectBestForm,
                    }),
                    getPredictionsFor<FieldType>(boundRuleset, {
                        type: 'field',
                        subTypes: fieldTypes.filter((type) => !excludedFieldTypes.includes(type)),
                        selectBest,
                    }),
                ];
            },
            {
                maxTime: MIN_MAX_DETECTION_TIME,
                onMaxTime: (detectionTime) => {
                    const { hostname } = window.location;
                    logger.info(`[Detector] Slow down detected on ${hostname} (took ${detectionTime}ms)`);

                    if (detectionTime >= MAX_MAX_DETECTION_TIME) {
                        onBottleneck({ detectionTime, hostname });
                        throw new Error();
                    }
                },
            }
        )();

        const fieldMap = groupFields(formPredictions, fieldPredictions);

        const forms = formPredictions.map(({ fnode: formFNode, type: formType }) => {
            const fields = fieldMap.get(formFNode.element) ?? [];
            return {
                form: formFNode.element as HTMLElement,
                formType,
                fields: fields.sort(liftSort(compareDomNodes<HTMLInputElement>, prop('field'))),
            };
        });

        /* Form / fields flagging :
         * each detected form should be flagged via the `data-protonpass-form` attribute so as to
         * avoid triggering unnecessary detections if nothing of interest has changed in the DOM.
         * · `formPredictions` will include only visible forms : flag them with prediction class
         * · all form fields which have been detected should be flagged as processed with the
         *   `data-protonpass-field` attr. The remaining fields without classification results
         *   should only be flagged as processed if they are visible or `[type="hidden"]`. This
         *   heuristic flagging allows detection triggers to monitor new fields correctly.
         * · query all unprocessed forms (including invisible ones) and flag them as `NOOP` */

        /* only start tracking forms which have a positive detection result or
         * dangling forms which have at least one detected field */
        const formsToTrack = forms.filter(({ formType, fields }) => formType !== FormType.NOOP || fields.length > 0);

        clearDetectionCache(); /* clear visibility cache on each detection run */

        return formsToTrack;
    };

const isEnabled = (features: Record<CSFeatures, boolean>): boolean =>
    features.Autofill ||
    features.Autofill2FA ||
    features.Autosave ||
    features.AutosuggestAlias ||
    features.AutosuggestPassword;

export const createDetectorService = () => {
    const state: DetectorState = { rules: null };

    const detector = {
        init: async () => {
            await sendMessage
                .onSuccess(contentScriptMessage({ type: WorkerMessageType.WEBSITE_RULES_REQUEST }), ({ rules }) => {
                    if (rules !== null) {
                        logger.debug('[Detector] Resolved website detection rules');
                        state.rules = rules;
                    }
                })
                .catch(noop);
        },

        applyRules: () => {
            state.rules?.exclude?.forEach((selector) => {
                const match = document.querySelector<HTMLElement>(selector);
                if (match) flagSubtreeAsIgnored(match);
            });

            if (state.rules?.version === '2') {
                state.rules?.include?.forEach((rule) => {
                    const { selector, formType, fields } = rule;
                    const form = selectNodeFromPath(document, selector);
                    if (!form) return;

                    flagOverride({
                        form,
                        formType,
                        fields: (fields ?? [])
                            ?.map(({ selector, fieldType }) => {
                                const field = selectNodeFromPath(form, selector);
                                if (field) return { field, fieldType };
                            })
                            .filter(truthy),
                    });
                });
            }
        },

        isEnabled,

        /* Run pre-detection checks with proper timing to avoid blocking the UI.
         * Triggers rule application to exclude/include nodes for the classifier,
         * then runs prepass for clustering and heuristic exclusions.
         * Uses requestIdleCallback since visibility checks can be costly and
         * trigger DOM repaints, with a small delay to ensure DOM stability. */
        shouldRunDetection: (): Promise<boolean> =>
            new Promise(async (resolve) => {
                await wait(50);
                requestIdleCallback(() => {
                    detector.applyRules();
                    prepass();
                    resolve(shouldRunClassifier());
                });
            }),

        runDetection: createDetectionRunner(ruleset, document),
    };

    return detector;
};

export type DetectorService = ReturnType<typeof createDetectorService>;
