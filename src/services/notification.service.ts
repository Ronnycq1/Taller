import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export type NotifChannel = 'in_app' | 'email' | 'whatsapp';
export type NotifPayload = { titulo:string; mensaje:string; placa?:string; clienteId?:string; vehiculoId?:string; channel: NotifChannel };

export const notificationService = {
  async send(payload: NotifPayload){
    // Guarda en colección notifications para que el cliente la vea en su dashboard
    await addDoc(collection(db,'notifications'), { ...payload, fecha: new Date().toISOString(), leida:false });
    // Hook para email/whatsapp se integraría con Cloud Functions
    if(payload.channel==='email') console.log('[NOTIF EMAIL]', payload);
    if(payload.channel==='whatsapp') console.log('[NOTIF WHATSAPP]', payload);
    return true;
  },
  async notifyCitaCreada(placa:string, fecha:string, clienteId:string){
    return this.send({ titulo:'Cita confirmada', mensaje:`Tu cita para ${placa} el ${new Date(fecha).toLocaleString('es-EC')} fue confirmada`, placa, clienteId, channel:'in_app' });
  },
  async notifyVehiculoListo(placa:string, clienteId:string){
    return this.send({ titulo:'Vehículo listo', mensaje:`Tu vehículo ${placa} está listo para retiro`, placa, clienteId, channel:'in_app' });
  },
  async notifyMantenimientoVencido(placa:string, clienteId:string, meses:number){
    return this.send({ titulo:'Mantenimiento pendiente', mensaje:`Han pasado ${meses} meses desde tu último servicio para ${placa}. Agenda tu cita`, placa, clienteId, channel:'in_app' });
  }
};
