import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Usuario, Vehiculo } from '../../types';

interface OfflineMutation {
  type: string;
  data: any;
  timestamp: number;
}

interface UiState {
  isOnline: boolean;
  offlineQueue: OfflineMutation[];
  usuario: Usuario | null;
  activeTab: string;
  selectedVehicle: Vehiculo | null;
  publicVehicleId: string | null;
  showLoginModal: boolean;
  authReady: boolean;
}

// Read offline queue initially
let initialQueue: OfflineMutation[] = [];
try {
  const saved = localStorage.getItem("cq_offline_queue");
  if (saved) initialQueue = JSON.parse(saved);
} catch {
  initialQueue = [];
}

const initialState: UiState = {
  isOnline: navigator.onLine,
  offlineQueue: initialQueue,
  usuario: null,
  activeTab: 'dashboard',
  selectedVehicle: null,
  publicVehicleId: null,
  showLoginModal: false,
  authReady: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setIsOnline: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setOfflineQueue: (state, action: PayloadAction<OfflineMutation[]>) => {
      state.offlineQueue = action.payload;
    },
    addOfflineMutation: (state, action: PayloadAction<OfflineMutation>) => {
      state.offlineQueue.push(action.payload);
      localStorage.setItem("cq_offline_queue", JSON.stringify(state.offlineQueue));
    },
    clearOfflineQueue: (state) => {
      state.offlineQueue = [];
      localStorage.setItem("cq_offline_queue", JSON.stringify([]));
    },
    setUsuario: (state, action: PayloadAction<Usuario | null>) => {
      state.usuario = action.payload;
    },
    setActiveTab: (state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setSelectedVehicle: (state, action: PayloadAction<Vehiculo | null>) => {
      state.selectedVehicle = action.payload;
    },
    setPublicVehicleId: (state, action: PayloadAction<string | null>) => {
      state.publicVehicleId = action.payload;
    },
    setShowLoginModal: (state, action: PayloadAction<boolean>) => {
      state.showLoginModal = action.payload;
    },
    setAuthReady: (state, action: PayloadAction<boolean>) => {
      state.authReady = action.payload;
    },
  },
});

export const {
  setIsOnline,
  setOfflineQueue,
  addOfflineMutation,
  clearOfflineQueue,
  setUsuario,
  setActiveTab,
  setSelectedVehicle,
  setPublicVehicleId,
  setShowLoginModal,
  setAuthReady,
} = uiSlice.actions;

export default uiSlice.reducer;
