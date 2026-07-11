# Prompt para Figma AI — Plataforma web "OptiFire"

---

## 1. Contexto del producto

**OptiFire** es una plataforma web de **despacho inteligente de emergencias para el Cuerpo de Bomberos**, potenciada con IA. A partir de una llamada de emergencia, el sistema transcribe en tiempo real, extrae los datos clave (dirección, gravedad, tipo de emergencia) y recomienda qué compañía(s) despachar según disponibilidad de chofer, dotación, especialidad y cercanía. El operador mantiene control total en todo momento: la IA **nunca corta ni detiene la transcripción por sí sola**.

Diseña una **aplicación web de escritorio** (uso en central de operaciones, monitor grande, operación 24/7). Prioriza alto contraste, jerarquía clara y baja carga cognitiva: el operador trabaja bajo presión y debe leer todo de un vistazo.

---

## 2. Sistema de diseño

**Paleta**

- Naranja bomberos (primario / acentos y CTA): `#F26522`
- Gris charcoal (fondos oscuros, barras, paneles): `#2B2B2B` y `#36393F`
- Blanco (fondos de contenido, tarjetas): `#FFFFFF`
- Grises neutros de apoyo: `#F4F4F5`, `#D4D4D8`, `#71717A`
- Colores semánticos:
    - Éxito / dato confirmado: verde `#22C55E`
    - Advertencia / gravedad media: ámbar `#F59E0B`
    - Peligro / gravedad crítica: rojo `#EF4444`
    - Información / GPS activo: azul `#3B82F6`

**Escala de gravedad** (usar como sistema de color coherente): Leve (verde) · Moderada (ámbar) · Grave (naranja) · Crítica (rojo).

**Tipografía:** sans-serif de alta legibilidad (Inter). Títulos en semibold, cuerpo regular. Números y tiempos (ETA, cronómetros) en tabular/monoespaciado para lectura rápida.

**Estilo visual:** limpio y funcional, esquinas suavemente redondeadas (8–12px), sombras sutiles, botones grandes y táctiles, iconografía lineal consistente. Tema principal claro con barras laterales/superiores en charcoal.

**Logo:** símbolo representativo de bomberos (casco + hacha cruzada, o llama estilizada dentro de un escudo) en naranja sobre charcoal. Colócalo en el login y en la barra superior de la app. Wordmark "OptiFire" al lado.

---

## 3. Roles de usuario

- **Operador:** acceso completo al flujo de despacho (secciones 5.1 a 5.7).
- **Bombero (solo Comandantes):** acceso restringido. Solo consulta: historial de llamadas con sus informes DOCX enlazados, e historial de dotación disponible por día. Los bomberos comunes **no** tienen acceso a la plataforma.

**Regla de resolución de rol:** el usuario inicia sesión con **RUT + contraseña**; el rol (operador / comandante) está asociado a la cuenta y determina automáticamente qué interfaz se despliega tras validar credenciales.

**Sesión:** expira automáticamente **todos los días a las 00:00 hrs**. Muestra un banner discreto en la barra superior con la hora de cierre de sesión (ej. "Sesión activa · cierra a las 00:00").

---

## 4. Estructura de navegación

- **Layout autenticado:** barra lateral izquierda (charcoal) con navegación por rol + barra superior con logo, buscador contextual, notificaciones y menú de perfil (cerrar sesión).
- **Operador — ítems de menú:** Panel · Atender llamada · Compañías y disponibilidad · Seguimiento GPS · Informes.
- **Comandante — ítems de menú:** Panel · Historial de llamadas · Dotación por día.

Genera cada pantalla como un frame independiente y conéctalas con las transiciones descritas.

---

## 5. Pantallas

### Módulo de acceso

**5.0.1 — Login**

- Card centrada sobre fondo charcoal con el logo arriba.
- Campos: **RUT** (con formato y validación de dígito verificador chileno, ej. 12.345.678-9) y **Contraseña**.
- Validación en vivo con estados de error ("RUT inválido", "Credenciales incorrectas").
- Botón primario naranja "Ingresar". Enlace secundario "¿Olvidaste tu contraseña?".
- Nota visible: "La sesión se cierra automáticamente a las 00:00 hrs."

**5.0.2 — Recuperar contraseña** (pantalla de apoyo): ingresar RUT → confirmación de envío.

**5.0.3 — Redirección por rol:** pantalla breve de carga que resuelve el rol y lleva al Panel correspondiente.

---

### 5.1 Panel del Operador (Dashboard)

- Encabezado con resumen del día: llamadas activas, llamadas atendidas hoy, compañías disponibles, dotación total en servicio.
- CTA principal grande **"Atender llamada entrante"**.
- Lista de emergencias en curso (con estado: en transcripción / despachada / carros en ruta / finalizada).
- Widget de estado de compañías (disponibles / sin chofer / fuera de servicio).

### 5.2 Recepción de llamada entrante

- Estado de "llamada entrante" con animación de timbre, número/ID de llamada y cronómetro.
- Botones grandes: **Atender** (primario) / Rechazar.
- Al atender → transición a la pantalla de transcripción en tiempo real.

### 5.3 Transcripción en tiempo real *(pantalla central de trabajo del operador)*

Layout de tres zonas:

**a) Panel de transcripción en vivo (columna central/izquierda)**

- Texto de la llamada apareciendo en tiempo real, con distinción visual operador / llamante.
- Cronómetro de llamada y estado "Transcribiendo…".

**b) Mapa de ubicación (columna derecha, superior)**

- Mapa con la ubicación detectada y marcador. Indicador de confianza de la detección.

**c) Tarjetas de datos recolectados (columna derecha, inferior)**
Tres tarjetas que la IA rellena a medida que aparece la información:

- **Dirección**
- **Gravedad** (con chip de color según escala)
- **Tipo de emergencia** (ej. incendio estructural, forestal, rescate vehicular, HAZMAT, apoyo médico)

Cada tarjeta muestra el dato detectado con **dos acciones**:

- ✅ **Ticket verde** = confirmar dato como correcto.
- ✏️ **Editar** = abre la casilla editable para corregir el valor manualmente.
Estados por tarjeta: pendiente · detectado (sin confirmar) · confirmado · editado.

**Barra inferior de estado:** indicador de "datos suficientes para despachar". Mientras no estén los mínimos, permanece deshabilitada. Cuando se completan, se **habilita el panel de decisión (5.4)**.

> La transcripción sigue corriendo siempre en segundo plano; ninguna acción la interrumpe.
> 

### 5.4 Panel de decisión de despacho

Aparece cuando la IA determina que hay información suficiente. Presenta **tres botones claramente diferenciados**:

1. **Proceder** (primario, naranja): el sistema decide qué compañía(s) desplegar → va a 5.5.
2. **Editar indicadores**: abre edición de los parámetros que determinó la IA por si alguno es incorrecto o impreciso.
3. **Continuar transcribiendo**: vuelve al foco de la transcripción para seguir recolectando datos.

### 5.5 Desglose de despacho

- Muestra la(s) compañía(s) recomendada(s) por la IA como tarjetas.
- Por cada compañía: nombre, distancia/tiempo estimado, dotación asignada, chofer disponible, especialidad y **justificación de la decisión** (por qué la IA la eligió: cercanía + especialidad + dotación + chofer).
- Acciones: **Confirmar despacho** / Ajustar selección manualmente.
- Al confirmar → inicia el seguimiento GPS (5.6).

### 5.6 Seguimiento GPS de carros desplegados

- Mapa grande con los carros en ruta hacia la emergencia (marcadores en movimiento).
- Panel lateral por carro: compañía, estado (en ruta / llegó), **ETA**, cronómetro de tiempo transcurrido y confirmación de **llegada exitosa**.
- Registro de tiempos (despacho → salida → llegada).
- Al finalizar → botón **Generar informe** (5.7).

### 5.7 Generación de informe (DOCX editable)

- Vista previa del informe generado automáticamente: resumen de la llamada, datos confirmados (dirección, gravedad, tipo), compañías despachadas, justificación de la IA y tiempos de respuesta.
- Acciones: **Editar** (campos editables inline), **Descargar DOCX**, Guardar en historial.
- El informe queda enlazado a la llamada en el historial.

---

### 5.8 Compañías y disponibilidad *(fuente de datos del operador)*

Vista de gestión/consulta de las compañías, coherente con los datos que usa la IA:

- Tabla/grilla de compañías con: chofer disponible (sí/no), cantidad de bomberos disponibles, especialidad(es), ubicación/cercanía y estado (disponible / sin chofer / fuera de servicio).
- Filtros por especialidad y disponibilidad.

---

### Rol Bombero (Comandante) — solo lectura

**5.9 Panel del Comandante:** resumen simple con accesos directos a Historial de llamadas y Dotación por día. Sin ninguna función de despacho.

**5.10 Historial de llamadas de emergencia**

- Lista/tabla de llamadas pasadas: fecha/hora, dirección, tipo, gravedad, compañías despachadas, resultado.
- Cada registro enlaza a su **informe DOCX** (ver / descargar).
- Buscador y filtros por fecha, tipo y compañía.

**5.11 Historial de dotación disponible por día**

- Vista con el **promedio de bomberos disponibles por día**, por compañía.
- Gráfico de línea/barras temporal + tabla de detalle. Filtro por rango de fechas y compañía.

---

## 6. Estados y detalles a incluir

- Estados **vacío, cargando y error** en listas, mapas, transcripción e informes.
- Notificaciones (nueva llamada entrante, carro llegó, sesión próxima a expirar).
- Menú de perfil con **cerrar sesión** manual.
- Componentes reutilizables: tarjeta de dato con acciones ✓/editar, chip de gravedad, tarjeta de compañía, cronómetro/ETA, banner de sesión.
- Accesibilidad: alto contraste, tamaños de fuente cómodos, foco visible.

---

## 7. Entregable esperado

Un diseño de alta fidelidad, responsivo a escritorio, con todas las pantallas anteriores como frames conectados por los flujos: **Login → (rol) → Panel**; para Operador el flujo completo **Atender llamada → Transcripción → Decisión → Desglose → GPS → Informe**; para Comandante los flujos de consulta de historial y dotación. Mantén consistencia estricta con el sistema de diseño (naranja / charcoal / blanco) y el logo de bomberos en todas las pantallas.