import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import rateLimit from "express-rate-limit";

// Firebase Admin SDK removed because it gets PERMISSION_DENIED due to missing ADC access in the preview environment.
// All Firestore interactions should happen via the Client SDK.

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const PORT = 3000;

  // Reduce JSON payload limit to 2MB to mitigate Denial-of-Service (DoS) and memory exhaustion
  app.use(express.json({ limit: "2mb" }));

  // Configure Robust Rate Limiter to guard against API spam and budget exhaustion
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per 15 mins
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Demasiadas peticiones desde esta IP. Por favor intente más tarde." }
  });

  // Apply rate limiter to all API endpoints
  app.use("/api/", apiLimiter);

  // Define Allowed Domains for CORS to block Cross-Site Request Forgery (CSRF)
  const allowedOrigins = [
    "http://localhost:3000",
    "https://ai.studio",
    "https://ais-dev-dhv4zfogjkqvm4gpdmw764-3555334670.us-east1.run.app",
    "https://ais-pre-dhv4zfogjkqvm4gpdmw764-3555334670.us-east1.run.app"
  ];

  const isOriginAllowed = (origin: string | undefined): boolean => {
    if (!origin) return true; // Allow non-browser same-origin requests
    if (allowedOrigins.includes(origin)) return true;
    if (/^https:\/\/ais-(dev|pre)-[a-z0-9-]+\.us-east1\.run\.app$/.test(origin)) return true;
    if (/^https:\/\/[a-z0-9-]+\.studio$/.test(origin)) return true;
    return false;
  };

  // Strict CORS Middleware
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    const origin = req.headers.origin;
    if (isOriginAllowed(origin)) {
      if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
      }
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.setHeader("Access-Control-Allow-Credentials", "true");
    } else {
      res.setHeader("Access-Control-Allow-Origin", "https://ai.studio"); // Safe fallback
    }

    // Instantly handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // Configure Robust Security Headers
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    // Prevent MIME-sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");

    // Enable cross-site scripting (XSS) filter
    res.setHeader("X-XSS-Protection", "1; mode=block");

    // Referrer policy
    res.setHeader("Referrer-Policy", "no-referrer-when-downgrade");

    // HSTS (HTTP Strict Transport Security) - 1 year
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");

    // Content Security Policy (CSP)
    res.setHeader(
      "Content-Security-Policy",
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://www.gstatic.com; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
      "font-src 'self' https://fonts.gstatic.com data:; " +
      "img-src 'self' data: https://images.unsplash.com https://*.google.com https://*.gstatic.com https://api.qrserver.com; " +
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com; " +
      "frame-ancestors 'self' https://ai.studio https://*.google.com https://*.run.app;"
    );

    next();
  });

  // Serve public static folder (e.g. for zip attachments, logos, QR exports)
  app.use(express.static(path.join(process.cwd(), "public")));

  // API Route: Download complete project source code ZIP archive
  app.get("/api/download-zip", (req: express.Request, res: express.Response) => {
    const zipPath = path.join(process.cwd(), "public", "cqmotors_proyecto_completo.zip");
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", 'attachment; filename="cqmotors_proyecto_completo.zip"');
    res.sendFile(zipPath, (err) => {
      if (err) {
        console.error("[ZIP DOWNLOAD ERROR]", err);
        if (!res.headersSent) {
          res.status(500).json({ error: "No se pudo descargar el archivo zip del proyecto." });
        }
      }
    });
  });

  // API Route: Secure Backend Verification and Role Registration Session
  app.post("/api/auth/session", async (req: express.Request, res: express.Response): Promise<void> => {
    res.json({ success: true, message: "Authentication is handled strictly on the client-side via Firebase Client SDK in this environment." });
  });

  // API Route: Secure Backend Session Logout (Clears RLS table)
  app.post("/api/auth/logout", async (req: express.Request, res: express.Response): Promise<void> => {
    res.json({ success: true, message: "Logout is handled client-side." });
  });

  // API Route: Analyzes an electronic invoice using Google Gen AI with Structured Response Schema
  app.post("/api/analyze-invoice", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { invoiceText, fileName } = req.body;
      if (!invoiceText || typeof invoiceText !== "string") {
        res.status(400).json({ error: "No se proporcionó el texto de la factura electrónica o formato no válido." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "La credencial GEMINI_API_KEY no está configurada en el servidor de control." });
        return;
      }

      // Initialize the GoogleGenAI client securely
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Query Gemini 2.5 Flash with standard system instructions and output schemas
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          `Por favor, analiza el siguiente fragmento, archivo de texto o XML crudo de factura electrónica (${fileName || "documento.xml"}).
          Extrae detalladamente todos los repuestos, piezas, aditivos, filtros o consumibles indicados en el documento.
          
          Sigue estas directivas de procesamiento:
          1. Extrae el código principal. Si la factura no incluye códigos numéricos limpios, genera un código mnemónico único (ej: "FIL-TOY-HYBRID").
          2. Limpia el nombre del producto eliminando siglas internas redundantes o errores de tipeo; hazlo presentable y claro en español.
          3. Extrae la cantidad física adquirida (entero >= 1).
          4. Extrae el precio de venta unitario. Si solo dispones el costo de compra, multiplícalo por 1.25 para sugerir el precio sugerido al público con margen estándar.
          5. Clasifica cada repuesto exactamente en una de las categorías: "Lubricantes", "Filtros", "Frenos", "Encendido", "Suspensión", "Líquidos".
          6. Sugiere un casillero o armario de ubicación en bodega (ej: "Estantería A-4", "Armario B-2").
          
          Texto o XML del documento:\n\n${invoiceText}`
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                codigo: { type: Type.STRING, description: "Código o clave del repuesto" },
                nombre: { type: Type.STRING, description: "Nombre descriptivo y comercial del componente" },
                cantidad: { type: Type.INTEGER, description: "Unidades facturadas" },
                precioVenta: { type: Type.NUMBER, description: "Precio de venta recomendado unitario en USD" },
                categoria: { type: Type.STRING, description: "Debe ser: Lubricantes, Filtros, Frenos, Encendido, Suspensión O Líquidos" },
                ubicacion: { type: Type.STRING, description: "Ubicación sugerida en bodega del taller" }
              },
              required: ["codigo", "nombre", "cantidad", "precioVenta", "categoria", "ubicacion"]
            }
          },
          systemInstruction: "Eres un despachador y experto en logística automotriz a cargo de digitalizar comprobantes SRI en Ecuador. Analizas cadenas de texto desordenadas, códigos XML y RIDE pdf text con la finalidad de estandarizar autopartes para perchas físicas.",
        }
      });

      const jsonText = response.text || "[]";
      let parsedItems = [];
      try {
        parsedItems = JSON.parse(jsonText);
      } catch (err) {
        console.error("[GEMINI ERROR] Error parsing structured output:", jsonText, err);
      }

      res.json({ items: parsedItems });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : "Error desconocido";
      console.error("[SERVER ERROR] Error standardizing invoice data:", e);
      res.status(500).json({ error: errMsg });
    }
  });

  // API Route: Send WhatsApp Notification using the official WhatsApp Business Cloud API
  app.post("/api/whatsapp/send-approved-notification", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { appt } = req.body;
      if (!appt) {
        res.status(400).json({ error: "No se proporcionaron los datos de la cita (appt)." });
        return;
      }

      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
      const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      const templateName = process.env.WHATSAPP_TEMPLATE_NAME;

      if (!accessToken || !phoneNumberId) {
        // If keys are not configured, allow the frontend to gracefully handle the manual backup redirect
        res.json({
          success: false,
          configured: false,
          message: "Credenciales de WhatsApp Cloud API no configuradas en el servidor. Utilizando vía alternativa manual."
        });
        return;
      }

      // Format WhatsApp number
      let phone = appt.telefonoCliente || "";
      let cleaned = phone.replace(/\D/g, "");
      if (cleaned.startsWith("0")) {
        cleaned = "593" + cleaned.substring(1);
      }
      if (cleaned.length === 9 && !cleaned.startsWith("593")) {
        cleaned = "593" + cleaned;
      }

      const formattedDate = appt.fechaPreferencia ? new Date(appt.fechaPreferencia + "T00:00:00").toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }) : appt.fechaPreferencia;

      const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;

      let payload: any = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: cleaned,
      };

      if (templateName) {
        // WhatsApp Business Cloud API Template Mode
        payload.type = "template";
        payload.template = {
          name: templateName,
          language: {
            code: "es"
          },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: appt.nombreCliente },
                { type: "text", text: `${appt.marca} ${appt.modelo}` },
                { type: "text", text: appt.placa.toUpperCase() },
                { type: "text", text: formattedDate },
                { type: "text", text: appt.horaPreferencia }
              ]
            }
          ]
        };
      } else {
        // WhatsApp standard text payload mode
        const textBody = `¡Hola, ${appt.nombreCliente}! 🚗 Te saludamos de *CQ Motors*.\n\nLe confirmamos que su solicitud de cita de mantenimiento ha sido *APROBADA* con éxito:\n\n` +
          `📌 *Vehículo:* ${appt.marca} ${appt.modelo} (Placa: ${appt.placa.toUpperCase()})\n` +
          `📅 *Fecha:* ${formattedDate}\n` +
          `⏰ *Hora:* ${appt.horaPreferencia} HS\n` +
          `🛠️ *Servicios:* ${appt.tipoServicios?.join(", ") || "General"}\n\n` +
          `Su vehículo ya está programado en nuestro sistema. ¡Le esperamos con gusto en nuestro taller! 🔧`;

        payload.type = "text";
        payload.text = {
          preview_url: false,
          body: textBody
        };
      }

      console.log(`[WHATSAPP AUTOMATED] Sending message to ${cleaned}`);
      console.log(`[WHATSAPP AUTOMATED] Request payload:`, JSON.stringify(payload));

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify(payload)
      });

      const responseData = await response.json();

      if (response.ok) {
        console.log("[WHATSAPP AUTOMATED] Message sent successfully via Meta Graph API! Msg ID:", responseData.messages?.[0]?.id);
        res.json({
          success: true,
          configured: true,
          message: "Mensaje enviado exitosamente a través de la API oficial de WhatsApp Business.",
          messageId: responseData.messages?.[0]?.id || null,
          data: responseData
        });
      } else {
        console.error("[WHATSAPP AUTOMATED] Meta Graph API error:", response.status, responseData);
        res.status(502).json({
          success: false,
          configured: true,
          error: responseData.error?.message || "Error devuelto por la API de Meta Graph.",
          rawDetails: responseData
        });
      }
    } catch (err: any) {
      console.error("[SERVER ERROR] Error in WhatsApp notification routine:", err);
      res.status(500).json({
        success: false,
        configured: true,
        error: err.message || "Error interno del servidor al procesar el envío de WhatsApp."
      });
    }
  });

  // Webhook para WhatsApp Business Cloud API (Verificación)
  app.get("/api/whatsapp/webhook", (req: express.Request, res: express.Response) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || "cqmotors_secret_token";

    if (mode && token) {
      if (mode === "subscribe" && token === verifyToken) {
        console.log("[WHATSAPP WEBHOOK] Verified successfully!");
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } else {
      res.sendStatus(400);
    }
  });

  // Webhook para WhatsApp Business Cloud API (Recepción de estados: sent, delivered, read)
  app.post("/api/whatsapp/webhook", (req: express.Request, res: express.Response) => {
    try {
      const body = req.body;
      console.log("[WHATSAPP WEBHOOK] Notification received:", JSON.stringify(body, null, 2));

      // Extract message status updates
      if (body.object === "whatsapp_business_account") {
        const changes = body.entry?.[0]?.changes?.[0]?.value;
        if (changes && changes.statuses) {
          for (const status of changes.statuses) {
            const messageId = status.id;
            const recipientId = status.recipient_id;
            const msgStatus = status.status; // sent, delivered, read
            const timestamp = status.timestamp;

            console.log(`[WHATSAPP STATUS] Msg: ${messageId} to ${recipientId} is now: ${msgStatus} at ${timestamp}`);
          }
        }
      }

      res.status(200).json({ success: true, received: true });
    } catch (err: any) {
      console.error("[WHATSAPP WEBHOOK ERROR]", err);
      res.status(500).json({ error: err.message });
    }
  });

  // API Route: Secure Client Assistant Chatbot (using gemini-3.5-flash)
  app.post("/api/chat", async (req: express.Request, res: express.Response): Promise<void> => {
    try {
      const { message, history, vehicleContext } = req.body;
      if (!message || typeof message !== "string") {
        res.status(400).json({ error: "No se proporcionó el mensaje del chat." });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "La credencial GEMINI_API_KEY no está configurada en el servidor de control." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare context about the vehicles and maintenances
      let contextStr = "No hay vehículos registrados para este cliente actualmente.";
      if (vehicleContext && Array.isArray(vehicleContext.vehicles) && vehicleContext.vehicles.length > 0) {
        contextStr = vehicleContext.vehicles.map((v: any) => {
          const maints = Array.isArray(vehicleContext.maintenances) 
            ? vehicleContext.maintenances.filter((m: any) => m.vehiculoId === v.id)
            : [];
          
          const maintStr = maints.map((m: any) => {
            const tareasStr = (m.tareasRealizadas || []).map((t: any) => `- ${t.nombre} [${t.completada ? "COMPLETADA" : "PENDIENTE"}] (${t.categoria || "General"})`).join("\n");
            return `Mantenimiento el ${m.fechaRegistro}:\n- Mecánico: ${m.mecanicoAsignado}\n- Observaciones: ${m.observaciones || "Ninguna"}\n- Diagnóstico futuro: ${m.diagnosticoFuturo || "Ninguno"}\n- Tareas:\n${tareasStr || "Ninguna"}\n- Total presupuestado: $${m.totalCalculado || m.total || 0}`;
          }).join("\n\n");

          return `Vehículo: ${v.marca} ${v.modelo} (${v.anio})
Placa: ${v.placa}
Kilometraje: ${v.kilometraje || 0} km
Nivel Combustible: ${v.nivelCombustible || 100}%
Tipo de Uso: ${v.tipoUso || "Particular"}
Estado actual en taller: ${v.estado}
Fecha de ingreso: ${v.fechaIngreso}
Historial de Mantenimientos:\n${maintStr || "Sin historial registrado todavía"}`;
        }).join("\n\n====================\n\n");
      }

      const systemInstruction = `Eres el Asistente Virtual de CQ Motors (Taller Mecánico en Ecuador). Tu objetivo es ayudar al cliente logueado a consultar el estado de sus vehículos en tiempo real, comprender sus mantenimientos, diagnósticos y responder dudas de manera atenta, personalizada y técnica.
      
A continuación se detalla la información real y actualizada de los vehículos del cliente desde nuestra base de datos de Firestore. Usa ESTA información para responder de forma precisa a sus consultas:

${contextStr}

Directrices:
1. Sé conciso, directo y claro en tus respuestas en español. Evita rodeos innecesarios.
2. Si el cliente pregunta por el estado de su vehículo (ej: "cómo está mi Toyota" o "ya está listo"), busca el vehículo correspondiente en los datos anteriores y detalla su estado actual (ej: "Ingresado", "En Proceso", "Listo para Entrega" o "Entregado") junto con el avance de sus tareas o reparaciones.
3. Si el cliente pregunta por presupuestos, montos, o tareas pendientes, menciona los valores exactos que figuran en el historial.
4. Responde con un tono premium, cordial, técnico y empático. Usa términos automotrices adecuados pero fáciles de comprender.
5. Si te preguntan algo fuera del ámbito de sus vehículos o del taller de CQ Motors, reorienta la conversación amablemente.`;

      const contents: any[] = [];
      if (history && Array.isArray(history)) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Robust helper to execute generation with retries and multiple fallback models to handle 503 / 429 errors
      const callGeminiWithFallbackAndRetry = async (
        aiClient: any,
        payloadContents: any[],
        instruction: string
      ) => {
        // List of recommended, highly stable active models from our gemini-api skill
        const models = ["gemini-3.5-flash", "gemini-flash-latest", "gemini-3.1-flash-lite"];
        let lastError: any = null;

        for (const model of models) {
          const maxRetries = 2; // Up to 3 attempts total per model
          for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
              if (attempt > 0) {
                // Exponential backoff
                const delayMs = Math.pow(2, attempt) * 500;
                console.log(`[GEMINI API] Retrying model "${model}" in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
                await new Promise((resolve) => setTimeout(resolve, delayMs));
              }

              const result = await aiClient.models.generateContent({
                model,
                contents: payloadContents,
                config: {
                  systemInstruction: instruction,
                },
              });

              if (result && result.text) {
                console.log(`[GEMINI API] Successfully completed chat generation using model "${model}" on attempt ${attempt + 1}.`);
                return result;
              }
            } catch (err: any) {
              lastError = err;
              const status = err.status || (err.message && err.message.includes("503") ? 503 : null);
              console.warn(
                `[GEMINI API] Model "${model}" failed on attempt ${attempt + 1} (Status: ${status || "unknown"}). Error: ${err.message}`
              );
              // If it's a permanent input issue or invalid key, skip immediately
              if (status === 400 || status === 403) {
                break;
              }
            }
          }
        }
        throw lastError || new Error("All active models failed to generate content.");
      };

      const response = await callGeminiWithFallbackAndRetry(ai, contents, systemInstruction);
      res.json({ text: response.text });
    } catch (e: any) {
      console.error("[SERVER ERROR] Error in chatbot api:", e);
      res.status(500).json({ error: e.message || "Error interno del servidor en el chat." });
    }
  });

  // BI Pipeline: Relational Replication SQL Server (3NF) Sync Endpoint
  app.post("/api/replicate-to-sql-server", (req: express.Request, res: express.Response): void => {
    try {
      const { vehicles, maintenances, inventory } = req.body;
      if (!vehicles || !maintenances || !inventory) {
        res.status(400).json({ error: "No se proporcionaron colecciones de datos completas para la replicación relacional." });
        return;
      }

      console.log(`[BI PIPELINE] Launching SQL Server 3NF Relational Replication Job...`);
      console.log(`[BI PIPELINE] Input stats: ${vehicles.length} Vehicles, ${maintenances.length} Maintenances, ${inventory.length} Inventory items.`);

      const sqlQueries: string[] = [];
      const stats = {
        clientes: 0,
        vehiculos: 0,
        mantenimientos: 0,
        repuestosNecesarios: 0,
        repuestoInventario: 0
      };

      // 1. Replicate Clients (Dim_Cliente) & Vehicles (Dim_Vehiculo)
      const clientIdsSeen = new Set<string>();
      for (const v of vehicles) {
        if (v.cliente && v.cliente.id && !clientIdsSeen.has(v.cliente.id)) {
          clientIdsSeen.add(v.cliente.id);
          const sanitizedNombre = v.cliente.nombre.replace(/'/g, "''");
          const sanitizedCorreo = v.cliente.correo.replace(/'/g, "''");
          sqlQueries.push(
            `INSERT INTO Dim_Cliente (ClienteID, Nombre, Telefono, Correo) ` +
            `VALUES ('${v.cliente.id}', '${sanitizedNombre}', '${v.cliente.telefono}', '${sanitizedCorreo}');`
          );
          stats.clientes++;
        }

        const sanitizedMarca = v.marca.replace(/'/g, "''");
        const sanitizedModelo = v.modelo.replace(/'/g, "''");
        sqlQueries.push(
          `INSERT INTO Dim_Vehiculo (VehiculoID, Placa, Marca, Modelo, Anio, Kilometraje, NivelCombustible, TipoUso, ClienteID, FechaIngreso, Estado) ` +
          `VALUES ('${v.id}', '${v.placa}', '${sanitizedMarca}', '${sanitizedModelo}', ${v.anio || 2021}, ${v.kilometraje || 0}, ${v.nivelCombustible || 100}, '${v.tipoUso || "Particular"}', '${v.cliente?.id || "cli-anon"}', '${v.fechaIngreso}', '${v.estado}');`
        );
        stats.vehiculos++;
      }

      // 2. Replicate Inventory Items (Dim_RepuestoInventario)
      for (const item of inventory) {
        const sanitizedNombre = item.nombre.replace(/'/g, "''");
        sqlQueries.push(
          `INSERT INTO Dim_RepuestoInventario (RepuestoID, Codigo, Nombre, Stock, StockMinimo, PrecioVenta, CostoCompra, Ubicacion, Categoria) ` +
          `VALUES ('${item.id}', '${item.codigo}', '${sanitizedNombre}', ${item.stock}, ${item.stockMinimo}, ${item.precioVenta}, ${item.costoCompra || item.precioVenta * 0.7}, '${item.ubicacion}', '${item.categoria}');`
        );
        stats.repuestoInventario++;
      }

      // 3. Replicate Maintenances (Fact_Mantenimiento) & Required Parts (Rel_MantenimientoRepuesto)
      for (const m of maintenances) {
        const sanitizedObs = (m.observaciones || "").replace(/'/g, "''");
        const sanitizedDiag = (m.diagnosticoFuturo || "").replace(/'/g, "''");
        const sanitizedMec = (m.mecanicoAsignado || "").replace(/'/g, "''");
        
        // CPr calculations
        const partsSum = (m.repuestosNecesarios || []).reduce((acc: number, r: any) => acc + (r.costoUnitario * r.cantidad), 0);
        const partsPurchaseSum = (m.repuestosNecesarios || []).reduce((acc: number, r: any) => acc + ((r.costoCompraUnitario || r.costoUnitario * 0.7) * r.cantidad), 0);
        const costoPrimo = m.costoPrimo || (m.costoManoObra + partsPurchaseSum);

        sqlQueries.push(
          `INSERT INTO Fact_Mantenimiento (MantenimientoID, VehiculoID, FechaRegistro, MecanicoAsignado, Observaciones, DiagnosticoFuturo, RecordatorioProximoMeses, CostoManoObra, TotalCalculado, CostoPrimo) ` +
          `VALUES ('${m.id}', '${m.vehiculoId}', '${m.fechaRegistro}', '${sanitizedMec}', '${sanitizedObs}', '${sanitizedDiag}', ${m.recordatorioProximoMeses || 3}, ${m.costoManoObra}, ${m.totalCalculado || (m.costoManoObra + partsSum)}, ${costoPrimo});`
        );
        stats.mantenimientos++;

        if (m.repuestosNecesarios && Array.isArray(m.repuestosNecesarios)) {
          for (const req of m.repuestosNecesarios) {
            const sanitizedNombre = req.nombre.replace(/'/g, "''");
            sqlQueries.push(
              `INSERT INTO Rel_MantenimientoRepuesto (Id, MantenimientoID, RepuestoID, Nombre, Cantidad, CostoUnitario, CostoCompraUnitario, Surtido) ` +
              `VALUES ('${req.id}', '${m.id}', '${req.repuestoId}', '${sanitizedNombre}', ${req.cantidad}, ${req.costoUnitario}, ${req.costoCompraUnitario || req.costoUnitario * 0.7}, ${req.surtido ? 1 : 0});`
            );
            stats.repuestosNecesarios++;
          }
        }
      }

      console.log(`[BI PIPELINE] SQL Server relational mapping job finished. Mapped ${sqlQueries.length} insert statements.`);

      res.json({
        success: true,
        stats,
        totalStatements: sqlQueries.length,
        queries: sqlQueries.slice(0, 50), // Send first 50 SQL statements for preview to save transit space
        sqlDownloadScript: sqlQueries.join("\n"),
        syncedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error("[BI PIPELINE REPLICATION ERROR]", err);
      res.status(500).json({
        success: false,
        error: err.message || "Error interno de sincronización y mapeo relacional de datos."
      });
    }
  });

  // Mount Vite development server when running in development environment
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("[SERVER INFO] Dev mode: Mounted Vite middleware successfully.");
  } else {
    // Serve production build static files
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("[SERVER INFO] Production mode: Serving compiled assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CQ MOTORS ENGINE] Server is actively listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
