import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { 
  Vehiculo, 
  Mantenimiento, 
  RepuestoInventario, 
  ActividadReciente, 
  CitaMantenimiento, 
  EncuestaSatisfaccion, 
  CanjePremio 
} from '../../types';

interface DataState {
  vehicles: Vehiculo[];
  maintenances: Mantenimiento[];
  inventory: RepuestoInventario[];
  activities: ActividadReciente[];
  appointments: CitaMantenimiento[];
  surveys: EncuestaSatisfaccion[];
  redemptions: CanjePremio[];
}

const initialState: DataState = {
  vehicles: [],
  maintenances: [],
  inventory: [],
  activities: [],
  appointments: [],
  surveys: [],
  redemptions: [],
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setVehicles: (state, action: PayloadAction<Vehiculo[]>) => {
      state.vehicles = action.payload;
    },
    setMaintenances: (state, action: PayloadAction<Mantenimiento[]>) => {
      state.maintenances = action.payload;
    },
    setInventory: (state, action: PayloadAction<RepuestoInventario[]>) => {
      state.inventory = action.payload;
    },
    setActivities: (state, action: PayloadAction<ActividadReciente[]>) => {
      state.activities = action.payload;
    },
    setAppointments: (state, action: PayloadAction<CitaMantenimiento[]>) => {
      state.appointments = action.payload;
    },
    setSurveys: (state, action: PayloadAction<EncuestaSatisfaccion[]>) => {
      state.surveys = action.payload;
    },
    setRedemptions: (state, action: PayloadAction<CanjePremio[]>) => {
      state.redemptions = action.payload;
    },
  },
});

export const {
  setVehicles,
  setMaintenances,
  setInventory,
  setActivities,
  setAppointments,
  setSurveys,
  setRedemptions,
} = dataSlice.actions;

export default dataSlice.reducer;
