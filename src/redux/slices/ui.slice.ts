import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface ModalState {
  isOpen: boolean;
  defenseId: number | null;
}

interface ResultModalState {
  isOpen: boolean;
  type: 'win' | 'lose' | 'half' | null;
  amount: number;
}

interface UIState {
  gameLobbyModal: ModalState;
  resultModal: ResultModalState;
  devLoginModal: boolean;
  isLoading: boolean;
  toast: {
    message: string;
    type: 'success' | 'error' | 'info';
  } | null;
}

const initialState: UIState = {
  gameLobbyModal: {
    isOpen: false,
    defenseId: null,
  },
  resultModal: {
    isOpen: false,
    type: null,
    amount: 0,
  },
  devLoginModal: false,
  isLoading: false,
  toast: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    openGameLobby: (state, action: PayloadAction<number>) => {
      state.gameLobbyModal.isOpen = true;
      state.gameLobbyModal.defenseId = action.payload;
    },
    closeGameLobby: (state) => {
      state.gameLobbyModal.isOpen = false;
      state.gameLobbyModal.defenseId = null;
    },
    openResultModal: (
      state,
      action: PayloadAction<{ type: 'win' | 'lose' | 'half'; amount: number }>
    ) => {
      state.resultModal.isOpen = true;
      state.resultModal.type = action.payload.type;
      state.resultModal.amount = action.payload.amount;
    },
    closeResultModal: (state) => {
      state.resultModal.isOpen = false;
      state.resultModal.type = null;
      state.resultModal.amount = 0;
    },
    openDevLogin: (state) => {
      state.devLoginModal = true;
    },
    closeDevLogin: (state) => {
      state.devLoginModal = false;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    showToast: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' }>
    ) => {
      state.toast = action.payload;
    },
    hideToast: (state) => {
      state.toast = null;
    },
  },
});

export const {
  openGameLobby,
  closeGameLobby,
  openResultModal,
  closeResultModal,
  openDevLogin,
  closeDevLogin,
  setLoading,
  showToast,
  hideToast,
} = uiSlice.actions;

export const uiReducer = uiSlice.reducer;
