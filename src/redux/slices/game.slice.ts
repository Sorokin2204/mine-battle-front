import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DefensePublic, MoveResult } from '@/types';

interface GameState {
  defenses: DefensePublic[];
  activeDefense: DefensePublic | null;
  selectedBombs: number[];
  isCreatingDefense: boolean;
  isAttacking: boolean;
  moveTimer: number | null;
  defenseTimer: number | null;
  lastMoveResult: MoveResult | null;
}

const initialState: GameState = {
  defenses: [],
  activeDefense: null,
  selectedBombs: [],
  isCreatingDefense: false,
  isAttacking: false,
  moveTimer: null,
  defenseTimer: null,
  lastMoveResult: null,
};

const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setDefenses: (state, action: PayloadAction<DefensePublic[]>) => {
      state.defenses = action.payload;
    },
    addDefense: (state, action: PayloadAction<DefensePublic>) => {
      const exists = state.defenses.find((d) => d.id === action.payload.id);
      if (!exists) {
        state.defenses.unshift(action.payload);
      }
    },
    updateDefense: (state, action: PayloadAction<DefensePublic>) => {
      const index = state.defenses.findIndex((d) => d.id === action.payload.id);
      if (index !== -1) {
        state.defenses[index] = action.payload;
      }
      if (state.activeDefense?.id === action.payload.id) {
        state.activeDefense = action.payload;
      }
    },
    removeDefense: (state, action: PayloadAction<number>) => {
      state.defenses = state.defenses.filter((d) => d.id !== action.payload);
      if (state.activeDefense?.id === action.payload) {
        state.activeDefense = null;
      }
    },
    setActiveDefense: (state, action: PayloadAction<DefensePublic | null>) => {
      state.activeDefense = action.payload;
    },
    setSelectedBombs: (state, action: PayloadAction<number[]>) => {
      state.selectedBombs = action.payload;
    },
    toggleBombPosition: (state, action: PayloadAction<number>) => {
      const position = action.payload;
      const index = state.selectedBombs.indexOf(position);
      if (index !== -1) {
        state.selectedBombs.splice(index, 1);
      } else if (state.selectedBombs.length < 2) {
        state.selectedBombs.push(position);
      }
    },
    clearSelectedBombs: (state) => {
      state.selectedBombs = [];
    },
    setCreatingDefense: (state, action: PayloadAction<boolean>) => {
      state.isCreatingDefense = action.payload;
    },
    setAttacking: (state, action: PayloadAction<boolean>) => {
      state.isAttacking = action.payload;
    },
    setMoveTimer: (state, action: PayloadAction<number | null>) => {
      state.moveTimer = action.payload;
    },
    setDefenseTimer: (state, action: PayloadAction<number | null>) => {
      state.defenseTimer = action.payload;
    },
    setLastMoveResult: (state, action: PayloadAction<MoveResult | null>) => {
      state.lastMoveResult = action.payload;
    },
    resetGameState: (state) => {
      state.activeDefense = null;
      state.selectedBombs = [];
      state.isCreatingDefense = false;
      state.isAttacking = false;
      state.moveTimer = null;
      state.defenseTimer = null;
      state.lastMoveResult = null;
    },
  },
});

export const {
  setDefenses,
  addDefense,
  updateDefense,
  removeDefense,
  setActiveDefense,
  setSelectedBombs,
  toggleBombPosition,
  clearSelectedBombs,
  setCreatingDefense,
  setAttacking,
  setMoveTimer,
  setDefenseTimer,
  setLastMoveResult,
  resetGameState,
} = gameSlice.actions;

export const gameReducer = gameSlice.reducer;
