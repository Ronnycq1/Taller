import React from 'react';
export type AlertType = 'success' | 'error' | 'warning' | 'info';
export interface AlertProps {
  type: AlertType;
  message: string;
  description?: string;
  dismissible?: boolean;
  autoCloseDelay?: number;
  onDismiss?: () => void;
  className?: string;
  id?: string;
}
export const AlertAccessible: React.FC<AlertProps> = ({
  type, message, description, dismissible=false, autoCloseDelay=5000, onDismiss, className, id,
}) => {
  const alertConfig: any = {
    success: { ariaRole: 'alert', ariaLive: 'polite', icon: 'OK', bgClass: 'bg-green-100', textClass: 'text-green-800', borderClass: 'border-green-200' },
    error: { ariaRole: 'alert', ariaLive: 'polite', icon: 'X', bgClass: 'bg-red-100', textClass: 'text-red-800', borderClass: 'border-red-200' },
    warning: { ariaRole: 'alert', ariaLive: 'polite', icon: '!', bgClass: 'bg-yellow-100', textClass: 'text-yellow-800', borderClass: 'border-yellow-200' },
    info: { ariaRole: 'status', ariaLive: 'polite', icon: 'i', bgClass: 'bg-blue-100', textClass: 'text-blue-800', borderClass: 'border-blue-200' },
  };
  const config = alertConfig[type];
  const [isDismissed, setIsDismissed] = React.useState(false);
  React.useEffect(()=>{
    if(!dismissible && autoCloseDelay>0){
      const t=setTimeout(()=>{}, autoCloseDelay);
      return ()=>clearTimeout(t);
    }
  },[dismissible, autoCloseDelay]);
  const finalId = id || 'alert-'+Date.now();
  if(isDismissed) return null;
  return React.createElement('div',{id:finalId, role:config.ariaRole, 'aria-live':config.ariaLive, 'aria-atomic':'true', className:'alert accessible-alert '+config.bgClass+' '+config.textClass+' '+config.borderClass+' '+(className||'')},
    React.createElement('div',{className:'alert-inner flex items-start gap-3 max-w-md px-4 py-3 rounded-lg'},
      React.createElement('span',{className:'alert-icon flex-shrink-0'}, config.icon),
      React.createElement('div',{className:'alert-content flex-1 min-w-0'},
        React.createElement('h3',{className:'alert-title font-medium text-sm'}, message),
        description ? React.createElement('p',{className:'alert-description text-xs mt-1'}, description) : null
      ),
      dismissible ? React.createElement('button',{type:'button', onClick:()=>{setIsDismissed(true); onDismiss?.();}, className:'alert-close btn-ghost rounded-md p-1', 'aria-label':'Cerrar alerta'}, 'X') : null
    )
  );
};
export const useAlerts = () => {
  const [alerts, setAlerts] = React.useState<Array<{id:string; type:AlertType; message:string; description?:string; dismissed:boolean}>>([]);
  const showAlert = (type:AlertType, message:string, options:any={})=>{
    const nid='alert-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    setAlerts(prev=>[...prev,{id:nid, type, message, description:options.description, dismissed:false}]);
    const timeout=options.autoCloseDelay ?? 5000;
    setTimeout(()=> setAlerts(prev=>prev.map(a=>a.id===nid?{...a, dismissed:true}:a)), timeout);
    return nid;
  };
  const dismissAlert = (nid:string)=> setAlerts(prev=>prev.map(a=>a.id===nid?{...a, dismissed:true}:a));
  const removeAlert = (nid:string)=> setAlerts(prev=>prev.filter(a=>a.id!==nid));
  React.useEffect(()=>{ setAlerts(prev=>prev.filter(a=>!a.dismissed)); },[alerts.length]);
  return { alerts, showAlert, dismissAlert, removeAlert };
};
