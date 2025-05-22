import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ActionItem {
  unitId:       string;
  sectorId:     string;
  description:  string;
}

interface Recommendation {
  timestamp:  string;
  priority:   string;

  recommendedActions: ActionItem[];
}

interface RecommendationState {
  recommendations:  Record<string, ActionItem>;
  timestamp:        string | null;
  priority:         string | null;
}

const initialState: RecommendationState = {
  recommendations:  {},
  timestamp:        null,
  priority:         null,
};

export const recommendationSlice = createSlice({
  name: 'recommendation',
  initialState,
  reducers: {
    updateRecommendation(state, action: PayloadAction<Recommendation>) {
      const { timestamp, recommendedActions, priority } = action.payload;

      state.recommendations = {};

      for (const actionItem of recommendedActions) {
        state.recommendations[actionItem.unitId] = actionItem;
      }

      state.timestamp = timestamp;
      state.priority = priority;
    },
  },
});

export const { updateRecommendation } = recommendationSlice.actions;
export default recommendationSlice.reducer;