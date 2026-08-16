import React, { useState, useEffect, useMemo } from "react";
import { UserRole, Usuario, Vehiculo, Mantenimiento, RepuestoInventario, ActividadReciente, CitaMantenimiento, EncuestaSatisfaccion, CanjePremio } from "./types";
import { 
  INITIAL_VEHICLES, 
  INITIAL_MAINTENANCE, 
  INITIAL_INVENTORY, 
  INITIAL_ACTIVITIES 
} from "./mockData";
import { db, auth, handleFirestoreError, OperationType } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, doc, setDoc, getDoc, getDocs, updateDoc, onSnapshot, deleteDoc, query, where, limit } from "firebase/firestore";
import Login from "./components/Login";
import DashboardOverview from "./components/DashboardOverview";
import VehicleManager from "./components/VehicleManager";
import MaintenanceSheet from "./components/MaintenanceSheet";
import InventoryManager from "./components/InventoryManager";
import ArchitectureGuide from "./components/ArchitectureGuide";
import AppointmentsManager from "./components/AppointmentsManager";
import BitacorasManager from "./components/BitacorasManager";
import CQMotorsLogo from "./components/CQMotorsLogo";
import PublicVehicleHistory from "./components/PublicVehicleHistory";
import LoyaltyRewardsCenter from "./components/LoyaltyRewardsCenter";
import BalancedScorecard from "./components/BalancedScorecard";
import LandingPage from "./components/LandingPage";

import { 
  Wrench, 
  LogOut, 
  User, 
  Clock, 
  FolderTree, 
  LayoutDashboard, 
  Car, 
  Package, 
  ShieldCheck,
  Award,
  ChevronDown,
  CalendarRange,
  BookOpen,
  Gift,
  MessageSquareHeart,
  TrendingUp,
  Sun,
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ToastProvider, useToast } from "./components/Toast";

function AppContent() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  // Dark mode state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem("cq_theme") === "dark";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("cq_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cq_theme", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  // Offline resilience states
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [offlineQueue, setOfflineQueue] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("cq_offline_queue");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Session authentication state. Fallback to null (shows Login card first)
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Selected vehicle for active repair worksheet (overrides tab content)
  const [selectedVehicle, setSelectedVehicle] = useState<Vehiculo | null>(null);

  // Scanned public QR tracking state
  const [publicVehicleId, setPublicVehicleId] = useState<string | null>(null);

  // Toggle state to open/close login overlay modal over LandingPage
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);

  // Operational states (Synced dynamically with Firestore in real-time)
  const [vehicles, setVehicles] = useState<Vehiculo[]>(INITIAL_VEHICLES);
  const [maintenances, setMaintenances] = useState<Mantenimiento[]>(INITIAL_MAINTENANCE);
  const [inventory, setInventory] = useState<RepuestoInventario[]>(INITIAL_INVENTORY);
  const [activities, setActivities] = useState<ActividadReciente[]>(INITIAL_ACTIVITIES);
  const [appointments, setAppointments] = useState<CitaMantenimiento[]>([]);
  const [surveys, setSurveys] = useState<EncuestaSatisfaccion[]>([]);
  const [redemptions, setRedemptions] = useState<CanjePremio[]>([]);

  // Clean initial array for appointments
  const DEMO_APPOINTMENTS: CitaMantenimiento[] = [];

  // Auth readiness state for Firestore subscriptions
  const [authReady, setAuthReady] = useState<boolean>(true);

  // Manage session persistence on mount using localStorage and ensure Firebase Auth
  useEffect(() => {
    const savedSession = localStorage.getItem("cqmotors_session");
    if (savedSession) {
      try {
        const uData = JSON.parse(savedSession);
        setUsuario(uData);
        console.log(`[AUTH SESSION] Restored local session for ${uData.fullName} (${uData.role})`);
      } catch (err) {
        console.error("No se pudo restaurar la sesión local:", err);
      }
    }

    // Ensure Firebase auth session exists (anonymous sign in for public QR scanners)
    if (!auth.currentUser) {
      signInAnonymously(auth).then(() => {
        setAuthReady(true);
      }).catch(err => {
        console.warn("Anonymous auth warning:", err);
        setAuthReady(true);
      });
    } else {
      setAuthReady(true);
    }
  }, []);

  // Automatic background database cleanup of simulated mock records & seed inventory if empty
  useEffect(() => {
    const checkAndSeedDatabase = async () => {
      try {
        // 1. Remove legacy simulated mock vehicle records if present in Firestore
        const mockVehIds = ["veh-1", "veh-2", "veh-3", "veh-4"];
        for (const vid of mockVehIds) {
          try {
            const vSnap = await getDoc(doc(db, "vehicles", vid));
            if (vSnap.exists()) {
              await deleteDoc(doc(db, "vehicles", vid));
              console.log(`[CLEANUP] Deleted mock vehicle record: ${vid}`);
            }
          } catch (e) {
            console.warn(`[CLEANUP] Could not delete mock vehicle ${vid}:`, e);
          }
        }

        // 2. Remove legacy simulated mock maintenance records if present in Firestore
        const mockMaintIds = ["maint-1", "maint-2", "maint-3"];
        for (const mid of mockMaintIds) {
          try {
            const mSnap = await getDoc(doc(db, "maintenances", mid));
            if (mSnap.exists()) {
              await deleteDoc(doc(db, "maintenances", mid));
              console.log(`[CLEANUP] Deleted mock maintenance record: ${mid}`);
            }
          } catch (e) {
            console.warn(`[CLEANUP] Could not delete mock maintenance ${mid}:`, e);
          }
        }

        // 3. Remove legacy simulated appointments if present
        const mockApptIds = ["appt-demo-1", "appt-demo-2"];
        for (const aid of mockApptIds) {
          try {
            const aSnap = await getDoc(doc(db, "appointments", aid));
            if (aSnap.exists()) {
              await deleteDoc(doc(db, "appointments", aid));
            }
          } catch (e) {
            // Ignore
          }
        }

        // 4. Seed Inventory if inventory collection is completely empty
        const invSnap = await getDocs(query(collection(db, "inventory"), limit(1)));
        if (invSnap.empty && INITIAL_INVENTORY.length > 0) {
          console.log("[SEEDING ENGINE] Inventory empty. Seeding spare parts catalog...");
          for (const i of INITIAL_INVENTORY) {
            await setDoc(doc(db, "inventory", i.id), i);
          }
        }
      } catch (err) {
        console.warn("[CLEANUP/SEEDING ENGINE] Could not verify or clean database:", err);
      }
    };
    checkAndSeedDatabase();
  }, []);

  // Track browser connection state and trigger background synchronization queue
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showInfo("Conexión Detectada", "Recuperando señal del taller. Sincronizando datos locales...");
    };
    const handleOffline = () => {
      setIsOnline(false);
      showWarning("Sin Conexión", "Dispositivo desconectado. El taller ahora opera en modo de resiliencia local.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Synchronize offline queue when internet connection returns
  useEffect(() => {
    if (isOnline && offlineQueue.length > 0) {
      const syncQueue = async () => {
        const queueToSync = [...offlineQueue];
        // Clear immediately to prevent double submission
        setOfflineQueue([]);
        localStorage.setItem("cq_offline_queue", JSON.stringify([]));

        let successCount = 0;
        for (const mutation of queueToSync) {
          try {
            if (mutation.type === "maintenance") {
              await setDoc(doc(db, "maintenances", mutation.data.id), mutation.data);
              successCount++;
            } else if (mutation.type === "vehicle_status") {
              await updateDoc(doc(db, "vehicles", mutation.data.id), { estado: mutation.data.estado });
              successCount++;
            } else if (mutation.type === "inventory_restock") {
              await updateDoc(doc(db, "inventory", mutation.data.id), { 
                stock: mutation.data.stock,
                costoCompra: mutation.data.costoCompra
              });
              successCount++;
            }
          } catch (err) {
            console.error("Failed to sync offline mutation, restoring to queue:", err);
            setOfflineQueue(prev => {
              const updated = [...prev, mutation];
              localStorage.setItem("cq_offline_queue", JSON.stringify(updated));
              return updated;
            });
          }
        }

        if (successCount > 0) {
          showSuccess("¡Sincronización Exitosa!", `⚡ Se han subido ${successCount} mutaciones offline acumuladas.`);
          appendLog("registro", `Resiliencia Offline: Sincronizadas con éxito ${successCount} operaciones guardadas temporalmente.`, usuario?.fullName || "Sistema Automático");
        }
      };

      syncQueue();
    }
  }, [isOnline, offlineQueue]);

  const clientVehicleIdsStr = useMemo(() => {
    if (!usuario || usuario.role !== UserRole.Cliente || !usuario.clienteId) return "";
    return vehicles.filter(v => v.cliente.id === usuario.clienteId).map(v => v.id).join(",");
  }, [vehicles, usuario]);

  const clientPlacasStr = useMemo(() => {
    if (!usuario || usuario.role !== UserRole.Cliente || !usuario.clienteId) return "";
    return vehicles.filter(v => v.cliente.id === usuario.clienteId).map(v => v.placa).join(",");
  }, [vehicles, usuario]);

  // Sync in real-time from Firestore based on authenticated role
  useEffect(() => {
    if (!authReady) return;

    // If no user is logged in, do NOT subscribe to any global collections. This blocks public data leaks!
    if (!usuario) {
      setVehicles([]);
      setMaintenances([]);
      setInventory([]);
      setActivities([]);
      setAppointments([]);
      setSurveys([]);
      setRedemptions([]);
      return;
    }

    const isStaff = usuario.role === UserRole.Administrador || 
                    usuario.role === UserRole.Mecanico || 
                    usuario.role === UserRole.Gerencia;

    let unsubVehicles = () => {};
    let unsubMaintenances = () => {};
    let unsubInventory = () => {};
    let unsubActivities = () => {};
    let unsubAppointments = () => {};
    let unsubSurveys = () => {};
    let unsubRedemptions = () => {};

    if (isStaff) {
      const isAlreadySeeded = localStorage.getItem("cq_db_seeded_v1");

      // 1. Staff: subscribe to vehicles
      unsubVehicles = onSnapshot(collection(db, "vehicles"), (snapshot) => {
        if (snapshot.empty && !isAlreadySeeded) {
          localStorage.setItem("cq_db_seeded_v1", "true");
          INITIAL_VEHICLES.forEach((v) => {
            setDoc(doc(db, "vehicles", v.id), v).catch((err) => {
              console.error("Error seeding vehicle", err);
            });
          });
        } else {
          const list: Vehiculo[] = [];
          snapshot.forEach((d) => { list.push(d.data() as Vehiculo); });
          setVehicles(list.sort((a, b) => b.fechaIngreso.localeCompare(a.fechaIngreso)));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "vehicles");
      });

      // 2. Staff: subscribe to all maintenances
      unsubMaintenances = onSnapshot(collection(db, "maintenances"), (snapshot) => {
        if (snapshot.empty && !isAlreadySeeded) {
          INITIAL_MAINTENANCE.forEach((m) => {
            setDoc(doc(db, "maintenances", m.id), m).catch((err) => {
              console.error("Error seeding maintenance", err);
            });
          });
        } else {
          const list: Mantenimiento[] = [];
          snapshot.forEach((d) => { list.push(d.data() as Mantenimiento); });
          setMaintenances(list);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "maintenances");
      });

      // 3. Staff: subscribe to inventory
      unsubInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
        if (snapshot.empty && !isAlreadySeeded) {
          INITIAL_INVENTORY.forEach((i) => {
            setDoc(doc(db, "inventory", i.id), i).catch((err) => {
              console.error("Error seeding inventory", err);
            });
          });
        } else {
          const list: RepuestoInventario[] = [];
          snapshot.forEach((d) => { list.push(d.data() as RepuestoInventario); });
          setInventory(list);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "inventory");
      });

      // 4. Staff: subscribe to activities with seeding
      unsubActivities = onSnapshot(collection(db, "activities"), (snapshot) => {
        if (snapshot.empty) {
          INITIAL_ACTIVITIES.forEach((a) => {
            setDoc(doc(db, "activities", a.id), a).catch((err) => {
              console.error("Error seeding activities", err);
            });
          });
        } else {
          const list: ActividadReciente[] = [];
          snapshot.forEach((d) => { list.push(d.data() as ActividadReciente); });
          setActivities(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "activities");
      });

      // 5. Staff: subscribe to appointments with seeding
      unsubAppointments = onSnapshot(collection(db, "appointments"), (snapshot) => {
        if (snapshot.empty) {
          DEMO_APPOINTMENTS.forEach((a) => {
            setDoc(doc(db, "appointments", a.id), a).catch((err) => {
              console.error("Error seeding appointments", err);
            });
          });
        } else {
          const list: CitaMantenimiento[] = [];
          snapshot.forEach((d) => { list.push(d.data() as CitaMantenimiento); });
          setAppointments(list.sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro)));
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "appointments");
      });

      // 6. Staff: subscribe to all surveys
      unsubSurveys = onSnapshot(collection(db, "surveys"), (snapshot) => {
        const list: EncuestaSatisfaccion[] = [];
        snapshot.forEach((d) => { list.push(d.data() as EncuestaSatisfaccion); });
        setSurveys(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      }, (error) => {
        console.warn("Alerta de Lectura de Encuestas:", error);
      });

      // 7. Staff: subscribe to all redemptions
      unsubRedemptions = onSnapshot(collection(db, "redemptions"), (snapshot) => {
        const list: CanjePremio[] = [];
        snapshot.forEach((d) => { list.push(d.data() as CanjePremio); });
        setRedemptions(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
      }, (error) => {
        console.warn("Alerta de Lectura de Canjes:", error);
      });

    } else if (usuario.role === UserRole.Cliente && usuario.clienteId) {
      // 1. Cliente: subscribe ONLY to their own registered vehicles (highly secure and restricted)
      const qVehicles = query(
        collection(db, "vehicles"),
        where("cliente.id", "==", usuario.clienteId)
      );
      unsubVehicles = onSnapshot(qVehicles, (snapshot) => {
        const list: Vehiculo[] = [];
        snapshot.forEach((d) => { list.push(d.data() as Vehiculo); });
        setVehicles(list);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, "vehicles");
      });

      // Extract client vehicle ids and placas
      const vehicleIds = clientVehicleIdsStr ? clientVehicleIdsStr.split(",") : [];
      const placas = clientPlacasStr ? clientPlacasStr.split(",") : [];

      // 2. Cliente: subscribe ONLY to maintenance records for their own vehicles
      if (vehicleIds.length > 0) {
        const qMaints = query(
          collection(db, "maintenances"),
          where("vehiculoId", "in", vehicleIds)
        );
        unsubMaintenances = onSnapshot(qMaints, (snapshot) => {
          const list: Mantenimiento[] = [];
          snapshot.forEach((d) => { list.push(d.data() as Mantenimiento); });
          setMaintenances(list);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, "maintenances");
        });
      }

      // 3. Cliente: subscribe ONLY to surveys and redemptions related to their vehicles' license plates
      if (placas.length > 0) {
        const qSurveys = query(
          collection(db, "surveys"),
          where("placa", "in", placas)
        );
        unsubSurveys = onSnapshot(qSurveys, (snapshot) => {
          const list: EncuestaSatisfaccion[] = [];
          snapshot.forEach((d) => { list.push(d.data() as EncuestaSatisfaccion); });
          setSurveys(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
        }, (error) => {
          console.warn("Alerta de Lectura de Encuestas Cliente:", error);
        });

        const qRedemptions = query(
          collection(db, "redemptions"),
          where("placa", "in", placas)
        );
        unsubRedemptions = onSnapshot(qRedemptions, (snapshot) => {
          const list: CanjePremio[] = [];
          snapshot.forEach((d) => { list.push(d.data() as CanjePremio); });
          setRedemptions(list.sort((a, b) => b.fecha.localeCompare(a.fecha)));
        }, (error) => {
          console.warn("Alerta de Lectura de Canjes Cliente:", error);
        });
      }
    }

    return () => {
      unsubVehicles();
      unsubMaintenances();
      unsubInventory();
      unsubActivities();
      unsubAppointments();
      unsubSurveys();
      unsubRedemptions();
    };
  }, [authReady, usuario, clientVehicleIdsStr, clientPlacasStr]);

  // Live Timer for header
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("es-EC", { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Parse scanned QR code queries from URL parameters (search & hash)
  useEffect(() => {
    const parseQRFromUrl = () => {
      let vId: string | null = null;
      
      // 1. Standard URL search parameters
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        vId = params.get("vehiculoId") || params.get("vehicleId") || params.get("placa") || params.get("v") || params.get("id");
      }
      
      // 2. Hash search parameters (e.g. /#/?vehiculoId=... or /#?vehicleId=...)
      if (!vId && window.location.hash) {
        const hashStr = window.location.hash;
        const qIdx = hashStr.indexOf("?");
        if (qIdx !== -1) {
          const hashParams = new URLSearchParams(hashStr.slice(qIdx));
          vId = hashParams.get("vehiculoId") || hashParams.get("vehicleId") || hashParams.get("placa") || hashParams.get("v") || hashParams.get("id");
        }
      }

      if (vId && vId.trim()) {
        console.log("[QR SCANNER] Detected scanned vehicle ID/placa from URL:", vId.trim());
        setPublicVehicleId(vId.trim());
      }
    };

    parseQRFromUrl();
    window.addEventListener("popstate", parseQRFromUrl);
    window.addEventListener("hashchange", parseQRFromUrl);
    return () => {
      window.removeEventListener("popstate", parseQRFromUrl);
      window.removeEventListener("hashchange", parseQRFromUrl);
    };
  }, []);

  // Tab/Resource Permission Security Guard
  const isActionAllowed = (role: UserRole | undefined, tab: string, targetVehicleId?: string): boolean => {
    if (!role) return false;
    
    // Strict block for Cliente role
    if (role === UserRole.Cliente) {
      if (tab !== "vehicles" && tab !== "bitacoras" && tab !== "loyalty") return false;
      if (targetVehicleId) {
        const vehicle = vehicles.find(v => v.id === targetVehicleId);
        if (!vehicle || !usuario?.clienteId || vehicle.cliente.id !== usuario.clienteId) {
          return false;
        }
      }
    }
    return true;
  };

  // Robust real-time navigation/state validation guard against manipulation/injection
  useEffect(() => {
    if (usuario) {
      // 1. Sanitize role validation
      const validRoles = Object.values(UserRole);
      if (!validRoles.includes(usuario.role)) {
        console.error("Acción sospechosa: Rol de usuario no válido detectado.");
        handleLogout();
        return;
      }

      // 2. Client-specific restrictions
      if (usuario.role === UserRole.Cliente) {
        if (activeTab !== "vehicles" && activeTab !== "bitacoras" && activeTab !== "loyalty") {
          setActiveTab("vehicles");
        }
        if (selectedVehicle) {
          const vehicle = vehicles.find(v => v.id === selectedVehicle.id);
          if (!vehicle || !usuario.clienteId || vehicle.cliente.id !== usuario.clienteId) {
            setSelectedVehicle(null);
          }
        }
      }
    }
  }, [usuario, activeTab, selectedVehicle, vehicles]);

  // Safe login callback
  const handleLoginSuccess = (usr: Usuario) => {
    setUsuario(usr);
    localStorage.setItem("cqmotors_session", JSON.stringify(usr));
    appendLog("registro", `Sesión iniciada por ${usr.fullName} (${usr.role}).`, usr.fullName);
  };

  // Safe logout callback
  const handleLogout = async () => {
    if (usuario) {
      appendLog("registro", `Sesión cerrada por ${usuario.fullName}.`, "Sistema Automático");
    }
    
    setUsuario(null);
    setSelectedVehicle(null);
    setActiveTab("dashboard");
    localStorage.removeItem("cqmotors_session");
  };



  // Logging engine helper
  const appendLog = async (
    tipo: ActividadReciente["tipo"],
    mensaje: string,
    operador: string
  ) => {
    const newAct: ActividadReciente = {
      id: `act-${Date.now()}`,
      tipo: tipo,
      mensaje: mensaje,
      fecha: new Date().toISOString(),
      usuario: operador,
      userId: auth.currentUser?.uid || "system"
    };
    try {
      await setDoc(doc(db, "activities", newAct.id), newAct);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `activities/${newAct.id}`);
    }
  };

  // 1. Add/Register incoming vehicle & match a default blank list
  const handleRegisterVehicle = async (newVehicle: Vehiculo) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Registro de vehículos bloqueado para este rol.");
      return;
    }
    try {
      await setDoc(doc(db, "vehicles", newVehicle.id), newVehicle);
    } catch (err) {
      showError("Error de Admisión", `No se pudo registrar el vehículo con placa ${newVehicle.placa}.`);
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${newVehicle.id}`);
      return;
    }
    
    // Create initial matching maintenance ledger with standard checklist template
    const defaultMaint: Mantenimiento = {
      id: `maint-${Date.now()}`,
      vehiculoId: newVehicle.id,
      fechaRegistro: new Date().toISOString(),
      mecanicoAsignado: usuario?.fullName || "David Mendoza",
      tareasRealizadas: [
        { id: `t-${Date.now()}-1`, nombre: "Inspección Multipuntos Inicial", completada: true, categoria: "Preventivo", costoEstimado: 25.0 },
        { id: `t-${Date.now()}-2`, nombre: "Sincronización menor de bujías", completada: false, categoria: "Encendido", costoEstimado: 20.0 },
        { id: `t-${Date.now()}-3`, nombre: "Revisión técnica de frenos delanteros", completada: false, categoria: "Frenos", costoEstimado: 15.0 }
      ],
      observaciones: "Vehículo en espera de diagnóstico específico. Niveles de fluidos estables.",
      repuestosNecesarios: [],
      diagnosticoFuturo: "",
      recordatorioProximoMeses: 3,
      costoManoObra: 40.0,
      totalCalculado: 100.0
    };

    try {
      await setDoc(doc(db, "maintenances", defaultMaint.id), defaultMaint);
      showSuccess("Admisión Exitosa", `Vehículo con placa ${newVehicle.placa} registrado correctamente en patio.`);
    } catch (err) {
      showError("Error de Conexión", "No se pudo crear la hoja de mantenimiento inicial.");
      handleFirestoreError(err, OperationType.WRITE, `maintenances/${defaultMaint.id}`);
      return;
    }

    appendLog("registro", `Admisión Vehicular: Ingresó placa ${newVehicle.placa} de ${newVehicle.cliente.nombre}.`, usuario?.fullName || "Administrador");
  };

  // Delete a yard/patio control sheet and its associated maintenance logs
  const handleDeleteVehicle = async (vehicleId: string) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Eliminación de hojas de control no permitida.");
      return;
    }
    const targetVeh = vehicles.find(v => v.id === vehicleId);
    if (!targetVeh) return;

    try {
      // Find and delete matching maintenances
      const relatedMaints = maintenances.filter(m => m.vehiculoId === vehicleId);
      for (const m of relatedMaints) {
        await deleteDoc(doc(db, "maintenances", m.id));
      }
      // Delete vehicle document
      await deleteDoc(doc(db, "vehicles", vehicleId));
      
      showSuccess("Control Eliminado", `Se eliminó la hoja de control de patio del vehículo con placa ${targetVeh.placa}.`);
      appendLog("registro", `Eliminación: Se borró la ficha de control de patio ${targetVeh.placa} de ${targetVeh.cliente.nombre}.`, usuario?.fullName || "Administrador");
      
      if (selectedVehicle?.id === vehicleId) {
        setSelectedVehicle(null);
      }
    } catch (err) {
      showError("Error al Eliminar", `No se pudo borrar la hoja de control de patio para la placa ${targetVeh.placa}.`);
      handleFirestoreError(err, OperationType.DELETE, `vehicles/${vehicleId}`);
    }
  };

  // 2. Add custom or update existing maintenance values
  const handleUpdateMaintenance = async (updatedMaint: Mantenimiento) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Modificación de mantenimiento no autorizada.");
      return;
    }

    // Update local state first to keep UI snappy
    setMaintenances(prev => prev.map(m => m.id === updatedMaint.id ? updatedMaint : m));

    if (!isOnline) {
      const mutation = { type: "maintenance", data: updatedMaint, timestamp: Date.now() };
      setOfflineQueue(prev => {
        const updated = [...prev, mutation];
        localStorage.setItem("cq_offline_queue", JSON.stringify(updated));
        return updated;
      });
      showInfo("Modo Offline", "⚠️ Tarea de mantenimiento guardada localmente en la cola de sincronización.");
      return;
    }

    try {
      await setDoc(doc(db, "maintenances", updatedMaint.id), updatedMaint);
      showSuccess("Hoja Actualizada", "Los cambios en la hoja de mantenimiento se guardaron en Firestore.");
    } catch (err) {
      showError("Error al Guardar", "No se pudieron registrar las actualizaciones de la hoja de mantenimiento.");
      handleFirestoreError(err, OperationType.WRITE, `maintenances/${updatedMaint.id}`);
      return;
    }
    
    // Find vehicle plate for clear audit logging
    const targetVeh = vehicles.find(v => v.id === updatedMaint.vehiculoId);
    if (targetVeh) {
      appendLog("estado_cambio", `Mantenimiento actualizado para placa ${targetVeh.placa}. Tareas Realizadas: ${updatedMaint.tareasRealizadas.filter(t => t.completada).length}/${updatedMaint.tareasRealizadas.length}.`, usuario?.fullName || "Técnico");
    }
  };

  // 3. Alter Vehicle execution state (En proceso, listo, entregado)
  const handleUpdateVehicleStatus = async (vehicleId: string, status: Vehiculo["estado"]) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Modificación de estado no autorizada.");
      return;
    }
    const target = vehicles.find(v => v.id === vehicleId);

    // Snappy local state update
    setVehicles(prev => prev.map(v => v.id === vehicleId ? { ...v, estado: status } : v));

    if (!isOnline) {
      const mutation = { type: "vehicle_status", data: { id: vehicleId, estado: status }, timestamp: Date.now() };
      setOfflineQueue(prev => {
        const updated = [...prev, mutation];
        localStorage.setItem("cq_offline_queue", JSON.stringify(updated));
        return updated;
      });
      showInfo("Modo Offline", "⚠️ Cambio de estado del vehículo guardado localmente en la cola de sincronización.");
      return;
    }

    try {
      await updateDoc(doc(db, "vehicles", vehicleId), { estado: status });
      if (target) {
        showSuccess("Estado Actualizado", `El vehículo ${target.placa} ahora está en estado "${status === "En Proceso" ? "En Mantenimiento" : status}".`);
      }
    } catch (err) {
      showError("Error de Actualización", `No se pudo actualizar el estado del vehículo.`);
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${vehicleId}`);
      return;
    }
    
    if (target) {
      appendLog("estado_cambio", `Vehículo ${target.placa} cambió su estado a: ${status === "En Proceso" ? "En Mantenimiento" : status}.`, usuario?.fullName || "Coordinador");
    }
  };

  // 3b. Update Client vehicle photos (persistent in demo session state)
  const handleUpdateVehiclePhotos = async (vehicleId: string, photos: string[]) => {
    if (!usuario) return;
    if (usuario.role === UserRole.Cliente) {
      const targetVel = vehicles.find(v => v.id === vehicleId);
      if (!targetVel || !usuario.clienteId || targetVel.cliente.id !== usuario.clienteId) {
        console.warn("Acceso denegado: Actualización de foto bloqueada por pertenencia.");
        return;
      }
    }
    const target = vehicles.find(v => v.id === vehicleId);
    try {
      await updateDoc(doc(db, "vehicles", vehicleId), { fotosCliente: photos });
      if (target) {
        showSuccess("Galería Actualizada", `Se agregó una foto para la placa ${target.placa}.`);
      }
    } catch (err) {
      showError("Error de Galería", `No se pudo asociar la fotografía al vehículo.`);
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${vehicleId}`);
      return;
    }

    if (target) {
      appendLog("registro", `Galería: Se cargó una nueva imagen para la placa ${target.placa}.`, usuario?.fullName || "Cliente");
    }
  };

  // 3c. Update Cover Image of Vehicle (persistent)
  const handleUpdateVehicleCoverImage = async (vehicleId: string, coverUrl: string | null) => {
    if (!usuario) return;
    if (usuario.role === UserRole.Cliente) {
       console.warn("Acceso denegado: Modificación de foto principal no autorizada.");
       return;
    }
    const target = vehicles.find(v => v.id === vehicleId);
    try {
      await updateDoc(doc(db, "vehicles", vehicleId), { imagenUrl: coverUrl });
      if (target) {
        showSuccess("Fotografía de Ingreso", coverUrl ? "Foto principal de ingreso guardada exitosamente." : "Foto principal removida.");
      }
    } catch (err) {
      showError("Error de Galería", `No se pudo actualizar la imagen de ingreso original.`);
      handleFirestoreError(err, OperationType.WRITE, `vehicles/${vehicleId}`);
      return;
    }

    if (target) {
      appendLog("registro", `Galería: Se actualizó/removió la foto de ingreso original para placa ${target.placa}.`, usuario?.fullName || "Operador");
    }
  };

  // 4. Warehouse Re-stock utility (Promedio Ponderado)
  const handleRestockItem = async (id: string, countAmount = 10, nuevoCosto?: number) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Abastecimiento bloqueado.");
      return;
    }
    const item = inventory.find(i => i.id === id);
    if (item) {
      const nextStock = item.stock + countAmount;
      const currentCost = item.costoCompra || Number((item.precioVenta * 0.7).toFixed(2));
      const inputCost = nuevoCosto !== undefined ? nuevoCosto : currentCost;
      const nextCost = nextStock > 0
        ? ((item.stock * currentCost) + (countAmount * inputCost)) / nextStock
        : currentCost;

      // Snappy local state update
      setInventory(prev => prev.map(i => i.id === id ? { ...i, stock: nextStock, costoCompra: Number(nextCost.toFixed(4)) } : i));

      if (!isOnline) {
        const mutation = { 
          type: "inventory_restock", 
          data: { id, stock: nextStock, costoCompra: Number(nextCost.toFixed(4)) }, 
          timestamp: Date.now() 
        };
        setOfflineQueue(prev => {
          const updated = [...prev, mutation];
          localStorage.setItem("cq_offline_queue", JSON.stringify(updated));
          return updated;
        });
        showInfo("Modo Offline", `⚠️ Ingreso de stock de ${item.nombre} encolado localmente.`);
        return;
      }

      try {
        await updateDoc(doc(db, "inventory", id), { 
          stock: nextStock,
          costoCompra: Number(nextCost.toFixed(4))
        });
        showSuccess("Stock Actualizado", `Surtidas +${countAmount} unidades de ${item.nombre}. Nuevo costo promedio ponderado: $${nextCost.toFixed(2)}. Stock total: ${nextStock}.`);
      } catch (err) {
        showError("Error de Bodega", `No se pudo actualizar el stock para ${item.nombre}.`);
        handleFirestoreError(err, OperationType.WRITE, `inventory/${id}`);
        return;
      }
      appendLog("registro", `Abastecimiento (Promedio Ponderado): Recibidas +${countAmount} u. de ${item.nombre} con costo unitario de adq: $${inputCost.toFixed(2)}. Nuevo costo ponderado: $${nextCost.toFixed(2)}.`, usuario?.fullName || "Bodeguero");
    }
  };

  // 5. Add completely custom parts category
  const handleAddNewPartToInventory = async (part: RepuestoInventario) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Registro de repuestos bloqueado.");
      return;
    }
    try {
      await setDoc(doc(db, "inventory", part.id), part);
      showSuccess("Catálogo Actualizado", `Se registró el nuevo repuesto "${part.nombre}" [${part.codigo}].`);
    } catch (err) {
      showError("Error de Inventario", `No se pudo registrar el repuesto ${part.nombre}.`);
      handleFirestoreError(err, OperationType.WRITE, `inventory/${part.id}`);
      return;
    }
    appendLog("registro", `Catálogo: Se registró un nuevo repuesto en bodega: ${part.nombre} [${part.codigo}].`, usuario?.fullName || "Bodeguero");
  };

  // 5b. Delete item from inventory catalog
  const handleDeletePartFromInventory = async (id: string) => {
    if (!usuario || usuario.role === UserRole.Cliente) {
      console.warn("Acceso denegado: Eliminación de repuestos bloqueado.");
      return;
    }
    const item = inventory.find(i => i.id === id);
    if (!item) return;
    try {
      await deleteDoc(doc(db, "inventory", id));
      showSuccess("Catálogo Actualizado", `Se eliminó "${item.nombre}" del catálogo.`);
      appendLog("registro", `Catálogo: Se eliminó el repuesto del catálogo: ${item.nombre} [${item.codigo}].`, usuario?.fullName || "Administrador");
    } catch (err) {
      showError("Error de Bodega", `No se pudo eliminar ${item.nombre} del inventario.`);
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    }
  };

  // Safe navigation selector
  const navigateToTab = (tab: string) => {
    if (!usuario || !isActionAllowed(usuario.role, tab)) {
      console.warn(`Intento de navegación bloqueado para el rol ${usuario?.role}: pestaña ${tab}`);
      return;
    }
    setSelectedVehicle(null);
    setActiveTab(tab);
  };

  // Open vehicle sheet bypass helper
  const handleOpenVehicleMaint = (v: Vehiculo) => {
    setSelectedVehicle(v);
  };

  // Pre-calculated alerts count
  const criticalItems = inventory.filter(item => item.stock <= item.stockMinimo).length;

  const floatingDarkModeBtn = (
    <button
      type="button"
      onClick={toggleDarkMode}
      className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-slate-900 text-amber-400 rounded-full shadow-2xl border border-amber-500/30 hover:bg-slate-800 hover:border-amber-400 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2.5 group backdrop-blur-md"
      title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
      aria-label="Alternar modo oscuro"
    >
      {darkMode ? (
        <Sun className="w-5 h-5 text-amber-400 fill-amber-400/20 shrink-0" />
      ) : (
        <Moon className="w-5 h-5 text-indigo-300 fill-indigo-300/20 shrink-0" />
      )}
      <span className="text-xs font-bold text-slate-100 tracking-wide pr-0.5">
        {darkMode ? "Modo Claro" : "Modo Oscuro"}
      </span>
    </button>
  );

  if (publicVehicleId) {
    return (
      <>
        <PublicVehicleHistory
          vehicleId={publicVehicleId}
          vehicles={vehicles}
          maintenances={maintenances}
          onBackToApp={() => {
            setPublicVehicleId(null);
            try {
              const url = new URL(window.location.href);
              url.search = "";
              if (url.hash.includes("?")) {
                url.hash = url.hash.split("?")[0];
              }
              window.history.replaceState({}, "", url.toString());
            } catch (e) {
              console.warn("Could not clean URL search params:", e);
            }
          }}
        />
        {floatingDarkModeBtn}
      </>
    );
  }

  if (!usuario) {
    return (
      <>
        <LandingPage 
          onOpenLogin={() => setShowLoginModal(true)} 
          appointments={appointments}
          onSearchPlate={(plate) => setPublicVehicleId(plate)}
          vehicles={vehicles}
          maintenances={maintenances}
          darkMode={darkMode}
          onToggleDarkMode={toggleDarkMode}
        />
        
        {/* Apple-style premium modal containing our secure dashboard authentication */}
        <AnimatePresence>
          {showLoginModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-50 dark:bg-slate-900 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl relative max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-slate-800"
              >
                {/* Close Button */}
                <button 
                  onClick={() => setShowLoginModal(false)} 
                  className="absolute top-4 right-4 z-50 p-2.5 bg-slate-900/10 hover:bg-slate-900/20 text-slate-700 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
                  title="Cerrar panel de inicio de sesión"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                
                <Login 
                  onLoginSuccess={(usr) => {
                    handleLoginSuccess(usr);
                    setShowLoginModal(false);
                  }} 
                  vehicles={vehicles} 
                />
              </motion.div>
            </div>
          )}
        </AnimatePresence>
        {floatingDarkModeBtn}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans select-none antialiased">
      
      {/* HEADER BAR */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and Brand */}
            <CQMotorsLogo size="sm" />

            {/* Real-time Odometer Clock */}
            <div className="hidden md:flex items-center space-x-2 bg-slate-850 py-1.5 px-3 rounded-xl border border-slate-800 text-slate-300 font-mono text-xs">
              <Clock className="h-4 w-4 text-emerald-500 animate-pulse" />
              <span className="font-semibold">{timeStr || "00:00:00"}</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">Taller Central</span>
            </div>

            {/* Connection status with background sync status */}
            <div className={`flex items-center space-x-2 py-1.5 px-3 rounded-xl border text-xs font-mono font-bold transition-all ${
              isOnline 
                ? "bg-slate-850 text-emerald-400 border-slate-850" 
                : "bg-amber-950/70 text-amber-400 border-amber-800/80 animate-pulse"
            }`} title={isOnline ? "Taller en línea con Firestore" : `Modo offline. ${offlineQueue.length} cambios en cola.`}>
              <span className={`relative flex h-2 w-2`}>
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isOnline ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? "bg-emerald-500" : "bg-amber-500"}`} />
              </span>
              <span>{isOnline ? "EN LÍNEA" : `OFFLINE (${offlineQueue.length})`}</span>
            </div>

            {/* User Session profile with live simulated Role switch */}
            <div className="flex items-center space-x-3">
              
              {/* Botón Modo Oscuro / Claro */}
              <button
                type="button"
                onClick={toggleDarkMode}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl transition-all border border-slate-700/60 cursor-pointer flex items-center justify-center"
                title={darkMode ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
                aria-label="Alternar modo oscuro"
              >
                {darkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-300" />}
              </button>

              {/* Role Badge */}
              <div className="bg-slate-800 px-3 py-2 rounded-xl border border-slate-700/60 flex items-center space-x-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                <span className="text-[10px] uppercase font-bold text-slate-200 font-mono tracking-wider">
                  {usuario.role === UserRole.Administrador && "Admin"}
                  {usuario.role === UserRole.Mecanico && "Mecánico"}
                  {usuario.role === UserRole.Gerencia && "Gerente"}
                  {usuario.role === UserRole.Cliente && "Cliente"}
                </span>
              </div>

              {/* Logged Username info */}
              <div className="hidden lg:block text-right pr-1">
                <span className="text-xs font-bold text-white block leading-tight">{usuario.fullName}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Modo Activo</span>
              </div>

              {/* Logout action */}
              <button
                onClick={handleLogout}
                className="p-2 bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 rounded-xl transition-all border border-transparent hover:border-slate-705 cursor-pointer"
                title="Cerrar Sesión Corporativa"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* SUB-HEADER: TAB NAVIGATION CONTROLS */}
      <nav className="bg-white border-b border-slate-200/80 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-2 h-14 overflow-x-auto custom-scrollbar">
            
            {usuario.role !== UserRole.Cliente && (
              <button
                onClick={() => navigateToTab("dashboard")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "dashboard" && !selectedVehicle
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Tablero de Control</span>
              </button>
            )}

            {usuario.role !== UserRole.Cliente && (
              <button
                onClick={() => navigateToTab("bsc")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "bsc" && !selectedVehicle
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Cuadro de Mando (BSC)</span>
              </button>
            )}

            <button
              onClick={() => navigateToTab("vehicles")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "vehicles"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Car className="h-4 w-4" />
              <span>Control de Patio</span>
              {selectedVehicle && activeTab === "vehicles" && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Ficha: {selectedVehicle.placa}
                </span>
              )}
            </button>

            <button
              onClick={() => navigateToTab("bitacoras")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "bitacoras"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Bitácoras por Vehículo</span>
              {selectedVehicle && activeTab === "bitacoras" && (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-mono px-2 py-0.5 rounded-full font-extrabold uppercase">
                  Ficha: {selectedVehicle.placa}
                </span>
              )}
            </button>

            {usuario.role !== UserRole.Cliente && (
              <button
                onClick={() => navigateToTab("inventory")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "inventory" && !selectedVehicle
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Package className="h-4 w-4" />
                <span>Surtido de Bodega</span>
                {criticalItems > 0 && (
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {criticalItems}
                  </span>
                )}
              </button>
            )}

            {usuario.role !== UserRole.Cliente && (
              <button
                onClick={() => navigateToTab("appointments")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "appointments" && !selectedVehicle
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <CalendarRange className="h-4 w-4" />
                <span>Citas Recibidas</span>
                {appointments.filter(a => a.estado === "Pendiente").length > 0 && (
                  <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {appointments.filter(a => a.estado === "Pendiente").length}
                  </span>
                )}
              </button>
            )}

            {usuario.role !== UserRole.Cliente && (
              <button
                onClick={() => navigateToTab("architecture")}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "architecture" && !selectedVehicle
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <FolderTree className="h-4 w-4" />
                <span>Especificación & Esquema DB</span>
              </button>
            )}

            {/* Loyalty and Satisfaction Surveys Tab Button */}
            <button
              onClick={() => navigateToTab("loyalty")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-sans flex items-center space-x-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "loyalty" && !selectedVehicle
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Award className="h-4 w-4" />
              <span>{usuario.role === UserRole.Cliente ? "Club CQ & Recompensas" : "CRM Fidelidad & Encuestas"}</span>
              {usuario.role !== UserRole.Cliente && surveys.length > 0 && (
                <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {surveys.length}
                </span>
              )}
            </button>

          </div>
        </div>
      </nav>

      {/* CORE FRAMEWORK BODY LAYOUT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedVehicle ? `maint-${selectedVehicle.id}` : activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="focus:outline-none"
          >
            {/* If a vehicle sheet is specifically selected, bypass regular tabs to keep user focus! */}
            {selectedVehicle && isActionAllowed(usuario.role, "vehicles", selectedVehicle.id) ? (
              <MaintenanceSheet
                vehicle={vehicles.find(v => v.id === selectedVehicle.id) || selectedVehicle}
                vehicleMaintenances={maintenances.filter(m => m.vehiculoId === selectedVehicle.id)}
                inventory={inventory}
                userRole={usuario.role}
                onGoBack={() => setSelectedVehicle(null)}
                onUpdateMaintenance={handleUpdateMaintenance}
                onUpdateVehicleStatus={handleUpdateVehicleStatus}
                onUpdateVehiclePhotos={handleUpdateVehiclePhotos}
                onUpdateVehicleCoverImage={handleUpdateVehicleCoverImage}
                onDeleteVehicle={handleDeleteVehicle}
              />
            ) : (
              <>
                {activeTab === "dashboard" && isActionAllowed(usuario.role, "dashboard") && (
                  <DashboardOverview
                    vehicles={usuario && usuario.role === UserRole.Cliente && usuario.clienteId
                      ? vehicles.filter(v => v.cliente.id === usuario.clienteId)
                      : vehicles
                    }
                    maintenances={maintenances}
                    inventory={inventory}
                    activities={activities}
                    userRole={usuario.role}
                    onNavigateToTab={navigateToTab}
                    onRestockItem={handleRestockItem}
                    onOpenVehicleMaint={handleOpenVehicleMaint}
                    onUpdateVehicleStatus={handleUpdateVehicleStatus}
                  />
                )}

                {activeTab === "bsc" && isActionAllowed(usuario.role, "bsc") && (
                  <BalancedScorecard
                    vehicles={vehicles}
                    maintenances={maintenances}
                    inventory={inventory}
                    appointments={appointments}
                    surveys={surveys}
                    redemptions={redemptions}
                    userRole={usuario.role}
                  />
                )}

                {activeTab === "vehicles" && isActionAllowed(usuario.role, "vehicles") && (
                  <VehicleManager
                    vehicles={(usuario && usuario.role === UserRole.Cliente && usuario.clienteId
                      ? vehicles.filter(v => v.cliente.id === usuario.clienteId)
                      : vehicles
                    ).filter(v => v.estado !== "Entregado")}
                    userRole={usuario.role}
                    onRegisterVehicle={handleRegisterVehicle}
                    onSelectVehicle={handleOpenVehicleMaint}
                    onDeleteVehicle={handleDeleteVehicle}
                  />
                )}

                {activeTab === "bitacoras" && isActionAllowed(usuario.role, "bitacoras") && (
                  <BitacorasManager
                    vehicles={usuario && usuario.role === UserRole.Cliente && usuario.clienteId
                      ? vehicles.filter(v => v.cliente.id === usuario.clienteId)
                      : vehicles
                    }
                    maintenances={maintenances}
                    userRole={usuario.role}
                    onSelectVehicle={handleOpenVehicleMaint}
                    onDeleteVehicle={handleDeleteVehicle}
                  />
                )}

                {activeTab === "inventory" && isActionAllowed(usuario.role, "inventory") && (
                  <InventoryManager
                    inventory={inventory}
                    userRole={usuario.role}
                    onRestockItem={handleRestockItem}
                    onAddNewPart={handleAddNewPartToInventory}
                    onDeletePart={handleDeletePartFromInventory}
                  />
                )}

                {activeTab === "appointments" && isActionAllowed(usuario.role, "appointments") && (
                  <AppointmentsManager
                    appointments={appointments}
                    userRole={usuario.role}
                    onRegisterVehicle={handleRegisterVehicle}
                  />
                )}

                {activeTab === "architecture" && isActionAllowed(usuario.role, "architecture") && (
                  <ArchitectureGuide 
                    vehicles={vehicles}
                    maintenances={maintenances}
                    inventory={inventory}
                  />
                )}

                {activeTab === "loyalty" && isActionAllowed(usuario.role, "loyalty") && (
                  <LoyaltyRewardsCenter
                    vehicles={vehicles}
                    maintenances={maintenances}
                    surveys={surveys}
                    redemptions={redemptions}
                    userRole={usuario.role}
                    clienteId={usuario.clienteId}
                    clienteNombre={usuario.fullName}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* SYSTEM REGISTRATION FOOTER FOOTPRINT */}
      <footer className="bg-white border-t border-slate-205/85 py-5 text-center text-xs text-slate-400 font-sans mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
          <span>CQ Motors S.A. &bull; Sistema de Gestión de Mantenimiento Vehicular (PWA) &copy; 2026</span>
          <span className="font-mono text-[10px]">
            Conectado de forma segura &bull; Enfoque Relacional SQL Server &bull; Power BI Ready
          </span>
        </div>
      </footer>
      {floatingDarkModeBtn}
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
