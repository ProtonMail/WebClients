import { createSlice } from '@reduxjs/toolkit';

import { EVENT_ACTIONS } from '@proton/shared/lib/constants';

import * as globalAction from '../actions';
import * as action from './importers.actions';
import { normalizeImporter, normalizeImporters } from './importers.helpers';
import { ImportersState } from './importers.interface';

const initialState: ImportersState = { importers: {}, activeImporters: {}, loading: 'idle' };

const importersSlice = createSlice({
    name: 'importers',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(action.loadImporters.pending, (state) => {
            state.loading = 'pending';
        });
        builder.addCase(action.loadImporters.rejected, (state) => {
            state.loading = 'failed';
        });
        builder.addCase(action.loadImporters.fulfilled, (state, action) => {
            state.loading = 'success';
            if (action.payload) {
                const { importersMap, activeImportersMap } = normalizeImporters(action.payload);

                state.importers = importersMap;
                state.activeImporters = activeImportersMap;
            }
        });

        builder.addCase(globalAction.event, (state, action) => {
            const importEvents = action.payload.Imports;
            if (importEvents) {
                importEvents.forEach(({ Importer, Action, ID }) => {
                    if (Importer) {
                        if (EVENT_ACTIONS.CREATE === Action) {
                            const { importer, activeImporters } = normalizeImporter(Importer);
                            state.importers[importer.ID] = importer;

                            activeImporters.forEach((activeImporter) => {
                                state.activeImporters[activeImporter.localID] = activeImporter;
                            });
                        }
                        if (EVENT_ACTIONS.UPDATE === Action) {
                            const { importer, activeImporters } = normalizeImporter(Importer);

                            // Update importer
                            state.importers[importer.ID] = importer;

                            // Delete importer active imports
                            const stateActiveImporterIds = Object.values(state.activeImporters)
                                .filter((activeImporter) => activeImporter.importerID === importer.ID)
                                .map(({ localID }) => localID);
                            stateActiveImporterIds.forEach((id) => {
                                delete state.activeImporters[id];
                            });

                            // Create updated importers
                            activeImporters.forEach((activeImporter) => {
                                state.activeImporters[activeImporter.localID] = activeImporter;
                            });
                        }
                    }
                    if (Action === EVENT_ACTIONS.DELETE) {
                        // Delete importer and it's related active importers
                        delete state.importers[ID];
                        Object.values(state.activeImporters).forEach((activeImporter) => {
                            if (activeImporter.importerID === ID) {
                                delete state.activeImporters[activeImporter.localID];
                            }
                        });
                    }
                });
            }
        });
    },
});

export default importersSlice.reducer;
