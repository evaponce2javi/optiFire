import { useState, useEffect, useRef } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Phone, PhoneOff, MapPin, Clock, Users, Truck, FileText,
  Bell, Search, CheckCircle, Edit2, AlertTriangle,
  Navigation, LogOut, Check, Download, Filter,
  Activity, X, ChevronDown, Building2,
  Shield, Flame, PhoneCall, Home, History,
  RefreshCw, AlertCircle, Send, Zap, Info, Eye, Calendar,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | "login" | "role-loading"
  | "op-dashboard" | "incoming-call" | "transcription"
  | "dispatch-breakdown" | "gps-tracking" | "report" | "companies"
  | "cmd-dashboard" | "call-history" | "daily-roster";

type Role = "operator" | "commander";
type Severity = "leve" | "moderada" | "grave" | "critica";

interface User { name: string; rut: string; role: Role }

// ─── Mock credentials ─────────────────────────────────────────────────────────

const CREDS: Record<string, { password: string; name: string; role: Role }> = {
  "12.345.678-5": { password: "bombero123",    name: "Carlos Muñoz",  role: "operator"  },
  "9.876.543-3":  { password: "comandante123", name: "Ana Torres",    role: "commander" },
};

// ─── Mock data ────────────────────────────────────────────────────────────────

const COMPANIES = [
  { id: 1, name: "1ª Compañía Bomba Providencia",  specialty: ["Incendios estructurales", "Rescate"],          driver: true,  crew: 12, status: "disponible",       distance: "0.8 km", eta: "4 min" },
  { id: 2, name: "3ª Compañía Bomba Santiago",      specialty: ["Incendios estructurales", "HAZMAT"],           driver: true,  crew: 9,  status: "disponible",       distance: "2.1 km", eta: "7 min" },
  { id: 3, name: "5ª Compañía Bomba Ñuñoa",         specialty: ["Rescate vehicular", "Apoyo médico"],           driver: false, crew: 8,  status: "sin chofer",       distance: "3.4 km", eta: "11 min" },
  { id: 4, name: "2ª Compañía Bomba Macul",         specialty: ["Incendios forestales"],                        driver: true,  crew: 6,  status: "disponible",       distance: "4.2 km", eta: "14 min" },
  { id: 5, name: "4ª Compañía Bomba La Reina",      specialty: ["Incendios forestales", "HAZMAT"],              driver: false, crew: 0,  status: "fuera de servicio",distance: "5.6 km", eta: "18 min" },
];

const ACTIVE_EMERGENCIES = [
  { id: "EMG-0847", address: "Providencia 1234 esq. Manuel Montt", type: "Incendio estructural", severity: "grave"    as Severity, status: "en transcripcion", time: "2 min"  },
  { id: "EMG-0846", address: "Av. Grecia 456, Ñuñoa",              type: "Rescate vehicular",   severity: "moderada" as Severity, status: "carros en ruta", time: "18 min" },
  { id: "EMG-0845", address: "Los Leones 890, Las Condes",         type: "Apoyo médico",        severity: "leve"     as Severity, status: "finalizada",      time: "47 min" },
];

const CALL_HISTORY = [
  { id: "EMG-0844", date: "10 Jul 2026 · 08:23", address: "Irarrázaval 550, Ñuñoa",         type: "Incendio estructural", severity: "critica"  as Severity, companies: "1ª, 3ª Compañía", result: "Controlado"       },
  { id: "EMG-0843", date: "10 Jul 2026 · 06:15", address: "Santa Rosa 1100, San Miguel",    type: "Rescate vehicular",   severity: "moderada" as Severity, companies: "5ª Compañía",      result: "Rescate exitoso"  },
  { id: "EMG-0842", date: "09 Jul 2026 · 22:44", address: "Apoquindo 3200, Las Condes",     type: "HAZMAT",              severity: "grave"    as Severity, companies: "2ª, 4ª Compañía", result: "Área evacuada"    },
  { id: "EMG-0841", date: "09 Jul 2026 · 19:12", address: "Amunátegui 345, Santiago",       type: "Incendio estructural",severity: "leve"     as Severity, companies: "3ª Compañía",      result: "Controlado"       },
  { id: "EMG-0840", date: "09 Jul 2026 · 15:30", address: "Vicuña Mackenna 890, Macul",     type: "Apoyo médico",        severity: "moderada" as Severity, companies: "5ª Compañía",      result: "Atendido"         },
];

const ROSTER_DATA = [
  { date: "04 Jul", "1a": 14, "3a": 10, "5a": 8  },
  { date: "05 Jul", "1a": 12, "3a": 11, "5a": 9  },
  { date: "06 Jul", "1a": 15, "3a": 9,  "5a": 7  },
  { date: "07 Jul", "1a": 13, "3a": 12, "5a": 10 },
  { date: "08 Jul", "1a": 11, "3a": 8,  "5a": 8  },
  { date: "09 Jul", "1a": 14, "3a": 10, "5a": 9  },
  { date: "10 Jul", "1a": 12, "3a": 9,  "5a": 8  },
];

const TRANSCRIPT_STEPS = [
  { role: "OPERADOR" as const,  text: "Central de emergencias, ¿en qué le puedo ayudar?" },
  { role: "LLAMANTE" as const,  text: "Hola, hay un incendio muy fuerte en el edificio de la calle Providencia 1234, hay humo por todos lados, estamos muy asustados." },
  { role: "OPERADOR" as const,  text: "Entendido. ¿Puede confirmar la dirección completa?" },
  { role: "LLAMANTE" as const,  text: "Sí, es Providencia 1234 esquina Manuel Montt, Providencia, Santiago. Es un edificio de departamentos de 6 pisos." },
  { role: "OPERADOR" as const,  text: "¿Hay personas atrapadas o en peligro inmediato?" },
  { role: "LLAMANTE" as const,  text: "Sí, los vecinos del quinto piso no pueden bajar, el pasillo está lleno de humo. El fuego está en el tercer y cuarto piso." },
  { role: "OPERADOR" as const,  text: "¿Las llamas son visibles desde el exterior del edificio?" },
  { role: "LLAMANTE" as const,  text: "Sí, se ven llamas por las ventanas del cuarto piso, y el humo es muy negro y denso." },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatRUT(digits: string): string {
  if (digits.length === 0) return "";
  if (digits.length === 1) return digits;
  const dv = digits.slice(-1).toUpperCase();
  const body = digits.slice(0, -1).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${body}-${dv}`;
}

function validateRUT(rut: string): boolean {
  const clean = rut.replace(/[^0-9kK]/g, "").toLowerCase();
  if (clean.length < 2) return false;
  const digits = clean.slice(0, -1);
  const dv = clean.slice(-1);
  let sum = 0, factor = 2;
  for (let i = digits.length - 1; i >= 0; i--) {
    sum += parseInt(digits[i]) * factor;
    factor = factor === 7 ? 2 : factor + 1;
  }
  const rem = 11 - (sum % 11);
  const expected = rem === 11 ? "0" : rem === 10 ? "k" : String(rem);
  return dv === expected;
}

function useTimer(active: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setS(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [active]);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

// ─── Design helpers ───────────────────────────────────────────────────────────

const SEV: Record<Severity, { label: string; bg: string; text: string; dot: string }> = {
  leve:     { label: "Leve",     bg: "bg-green-100",  text: "text-green-700",  dot: "bg-[#22C55E]" },
  moderada: { label: "Moderada", bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-[#F59E0B]" },
  grave:    { label: "Grave",    bg: "bg-orange-100", text: "text-orange-700", dot: "bg-[#F26522]" },
  critica:  { label: "Crítica",  bg: "bg-red-100",    text: "text-red-700",    dot: "bg-[#EF4444]" },
};

const ESTAT: Record<string, { label: string; bg: string; text: string }> = {
  "en transcripcion": { label: "En transcripción", bg: "bg-blue-100",   text: "text-blue-700"   },
  "despachada":       { label: "Despachada",        bg: "bg-amber-100",  text: "text-amber-700"  },
  "carros en ruta":   { label: "Carros en ruta",    bg: "bg-orange-100", text: "text-orange-700" },
  "finalizada":       { label: "Finalizada",         bg: "bg-green-100",  text: "text-green-700"  },
};

const SeverityChip = ({ sev }: { sev: Severity }) => {
  const c = SEV[sev];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

const StatusChip = ({ status }: { status: string }) => {
  const c = ESTAT[status] ?? { label: status, bg: "bg-gray-100", text: "text-gray-700" };
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>{c.label}</span>;
};

const CmpBadge = ({ status }: { status: string }) => {
  const clr = status === "disponible" ? "bg-green-100 text-green-700" : status === "sin chofer" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700";
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${clr} capitalize`}>{status}</span>;
};

// ─── Logo ─────────────────────────────────────────────────────────────────────

const Logo = ({ size = 32 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
    <path d="M16 2L4 7.5V17c0 7.5 5.5 14.1 12 15.5C23.5 31.1 29 24.5 29 17V7.5L16 2z" fill="#F26522" />
    <path d="M16 9c0 0-4 4.5-2 8.5 1.5-2 2-4.5 2-4.5s2.5 4 1 7.5c2.5-1.5 4.5-5.5 3-8.5 1 1 2.5-.5 2.5-.5s-1 3.5 1 6C24 14 22 9 16 9z" fill="white" fillOpacity="0.92" />
    <path d="M13.5 16.5c0 0 1.5 2.5 0 5C16 20.5 17 18 15.5 16.5H13.5z" fill="white" fillOpacity="0.65" />
  </svg>
);

// ─── Map placeholder ──────────────────────────────────────────────────────────

const MapView = ({ showCars = false }: { showCars?: boolean }) => (
  <div className="relative w-full h-full bg-[#dcd6cc] overflow-hidden rounded-xl">
    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.35) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.35) 1px,transparent 1px)", backgroundSize: "48px 48px" }} />
    {/* Blocks */}
    <div className="absolute top-[26%] left-[18%] w-[14%] h-[16%] bg-[#c4bdb3] rounded" />
    <div className="absolute top-[26%] left-[37%] w-[24%] h-[16%] bg-[#c4bdb3] rounded" />
    <div className="absolute top-[52%] left-[18%] w-[14%] h-[18%] bg-[#c4bdb3] rounded" />
    <div className="absolute top-[52%] left-[37%] w-[24%] h-[18%] bg-[#c4bdb3] rounded" />
    <div className="absolute top-[52%] left-[66%] w-[18%] h-[18%] bg-[#c4bdb3] rounded" />
    {/* Streets */}
    <div className="absolute top-[44%] left-0 right-0 h-5 bg-[#ede8e0]" />
    <div className="absolute top-[72%] left-0 right-0 h-2.5 bg-[#ede8e0]/80" />
    <div className="absolute top-[24%] left-0 right-0 h-2 bg-[#ede8e0]/70" />
    <div className="absolute left-[34%] top-0 bottom-0 w-5 bg-[#ede8e0]" />
    <div className="absolute left-[64%] top-0 bottom-0 w-2.5 bg-[#ede8e0]/80" />
    <div className="absolute left-[16%] top-0 bottom-0 w-2 bg-[#ede8e0]/70" />
    {/* Fire marker */}
    <div className="absolute top-[44%] left-[48%] -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center">
      <div className="absolute w-14 h-14 rounded-full bg-red-500/15 animate-ping" style={{ animationDuration: "1.8s" }} />
      <div className="absolute w-9 h-9 rounded-full bg-red-500/20" />
      <div className="relative w-8 h-8 rounded-full bg-[#EF4444] flex items-center justify-center shadow-lg">
        <Flame size={14} className="text-white" />
      </div>
    </div>
    {/* Station markers */}
    <div className="absolute top-[27%] left-[19%] w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center shadow z-10">
      <Building2 size={10} className="text-white" />
    </div>
    <div className="absolute top-[55%] left-[67%] w-5 h-5 rounded bg-[#3B82F6] flex items-center justify-center shadow z-10">
      <Building2 size={10} className="text-white" />
    </div>
    {/* Routes & moving cars */}
    {showCars && (
      <>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 400 300">
          <path d="M77 81 L136 132 L192 132" stroke="#F26522" strokeWidth="3" strokeDasharray="8 4" fill="none" strokeLinecap="round" />
          <path d="M266 165 L200 148 L192 132" stroke="#3B82F6" strokeWidth="3" strokeDasharray="8 4" fill="none" strokeLinecap="round" />
        </svg>
        <div className="absolute z-20" style={{ top: "42%", left: "30%" }}>
          <div className="w-6 h-6 rounded-lg bg-[#F26522] flex items-center justify-center shadow-lg ring-2 ring-white">
            <Truck size={11} className="text-white" />
          </div>
        </div>
        <div className="absolute z-20" style={{ top: "54%", left: "56%" }}>
          <div className="w-6 h-6 rounded-lg bg-[#3B82F6] flex items-center justify-center shadow-lg ring-2 ring-white">
            <Truck size={11} className="text-white" />
          </div>
        </div>
      </>
    )}
    {/* HUD overlays */}
    <div className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-700 flex items-center gap-1.5 shadow-sm">
      <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />Confianza GPS: 94%
    </div>
    <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-white/90 backdrop-blur rounded-lg px-3 py-2 shadow-sm">
      <div className="text-xs font-semibold text-gray-800">Providencia 1234 esq. Manuel Montt</div>
      <div className="text-xs text-gray-500 mt-0.5">Providencia, Santiago RM</div>
    </div>
  </div>
);

// ─── Login ────────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [rut, setRut] = useState("");
  const [pass, setPass] = useState("");
  const [rutErr, setRutErr] = useState("");
  const [credErr, setCredErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotRut, setForgotRut] = useState("");
  const [forgotDone, setForgotDone] = useState(false);

  const handleRut = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/[^0-9kK]/g, "");
    setRut(digits.length > 1 ? formatRUT(digits) : digits.toUpperCase());
    setRutErr(""); setCredErr("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateRUT(rut)) { setRutErr("RUT inválido. Verifique el dígito verificador."); return; }
    const cred = CREDS[rut];
    if (!cred || cred.password !== pass) { setCredErr("Credenciales incorrectas. Verifique su RUT y contraseña."); return; }
    setLoading(true);
    setTimeout(() => onLogin({ name: cred.name, rut, role: cred.role }), 1800);
  };

  if (forgot) {
    return (
      <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center p-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#2B2B2B] px-8 py-8 flex flex-col items-center gap-3">
            <Logo size={48} />
            <div className="text-center">
              <div className="text-white text-xl font-bold">OptiFire</div>
              <div className="text-gray-400 text-sm mt-0.5">Recuperar contraseña</div>
            </div>
          </div>
          {forgotDone ? (
            <div className="px-8 py-10 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-[#22C55E]" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Correo enviado</h3>
              <p className="text-sm text-gray-500 mb-6">Revise su correo institucional para restablecer la contraseña.</p>
              <button onClick={() => { setForgot(false); setForgotDone(false); setForgotRut(""); }} className="w-full py-3 bg-[#F26522] text-white rounded-xl font-bold hover:bg-[#d9581f] transition-colors">
                Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <div className="px-8 py-8">
              <p className="text-sm text-gray-600 mb-5">Ingrese su RUT y le enviaremos un enlace para restablecer su contraseña.</p>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">RUT</label>
              <input
                type="text" value={forgotRut}
                onChange={e => { const d = e.target.value.replace(/[^0-9kK]/g, ""); setForgotRut(d.length > 1 ? formatRUT(d) : d.toUpperCase()); }}
                placeholder="12.345.678-5"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#F26522] font-mono mb-5"
              />
              <button onClick={() => setForgotDone(true)} className="w-full py-3 bg-[#F26522] text-white rounded-xl font-bold hover:bg-[#d9581f] transition-colors mb-3">
                Enviar enlace
              </button>
              <button onClick={() => setForgot(false)} className="w-full py-2 text-gray-500 text-sm hover:text-gray-700 transition-colors">
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center p-4" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-[#2B2B2B] px-8 py-9 flex flex-col items-center gap-3">
            <Logo size={54} />
            <div className="text-center">
              <div className="text-white text-2xl font-extrabold tracking-tight">OptiFire</div>
              <div className="text-gray-400 text-sm mt-1">Sistema de despacho inteligente de emergencias</div>
            </div>
          </div>
          <form onSubmit={submit} className="px-8 py-8 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">RUT</label>
              <input
                type="text" value={rut} onChange={handleRut}
                placeholder="12.345.678-5" maxLength={12}
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors font-mono ${rutErr ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#F26522]"}`}
              />
              {rutErr && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{rutErr}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Contraseña</label>
              <input
                type="password" value={pass} onChange={e => { setPass(e.target.value); setCredErr(""); }}
                placeholder="••••••••"
                className={`w-full px-4 py-3 border-2 rounded-xl text-sm focus:outline-none transition-colors ${credErr ? "border-red-400 bg-red-50" : "border-gray-200 focus:border-[#F26522]"}`}
              />
              {credErr && <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1"><AlertCircle size={12} />{credErr}</p>}
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-[#F26522] text-white rounded-xl font-bold text-sm hover:bg-[#d9581f] active:bg-[#c04d1a] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 shadow-lg shadow-orange-200">
              {loading ? <><RefreshCw size={15} className="animate-spin" />Verificando...</> : "Ingresar"}
            </button>
            <button type="button" onClick={() => setForgot(true)} className="w-full text-sm text-[#F26522] hover:text-[#d9581f] transition-colors text-center">
              ¿Olvidaste tu contraseña?
            </button>
          </form>
          <div className="px-8 pb-7">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 text-center flex items-center justify-center gap-1.5">
              <Clock size={12} className="text-amber-500 shrink-0" />
              La sesión se cierra automáticamente a las 00:00 hrs.
            </div>
          </div>
        </div>
        <div className="mt-4 text-center text-xs text-gray-600 space-y-0.5">
          <div>Demo Operador: <span className="font-mono text-gray-400">12.345.678-5</span> / <span className="font-mono text-gray-400">bombero123</span></div>
          <div>Demo Comandante: <span className="font-mono text-gray-400">9.876.543-3</span> / <span className="font-mono text-gray-400">comandante123</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── Role loading ─────────────────────────────────────────────────────────────

function RoleLoadingScreen({ user, onDone }: { user: User; onDone: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1300);
    const t3 = setTimeout(() => { setStep(3); setTimeout(onDone, 400); }, 2000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onDone]);

  const steps = ["Verificando credenciales", "Cargando perfil de usuario", "Resolviendo rol y permisos"];
  return (
    <div className="min-h-screen bg-[#2B2B2B] flex items-center justify-center" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-center">
        <Logo size={56} />
        <div className="mt-3 text-white text-2xl font-extrabold tracking-tight">OptiFire</div>
        <div className="mt-8 space-y-3 text-left w-64 mx-auto">
          {steps.map((s, i) => (
            <div key={i} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i < step ? "text-[#22C55E]" : i === step ? "text-white" : "text-gray-600"}`}>
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${i < step ? "bg-[#22C55E]" : i === step ? "bg-[#F26522]" : "bg-gray-700"}`}>
                {i < step ? <Check size={11} className="text-white" /> : i === step ? <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" /> : null}
              </div>
              {s}
            </div>
          ))}
        </div>
        <div className="mt-10 text-gray-400 text-sm">
          Bienvenido/a, <span className="text-white font-semibold">{user.name}</span>
        </div>
        <div className="mt-1 text-gray-600 text-xs capitalize">
          Rol: {user.role === "operator" ? "Operador" : "Comandante"}
        </div>
      </div>
    </div>
  );
}

// ─── App shell ────────────────────────────────────────────────────────────────

const OP_NAV = [
  { id: "op-dashboard",      label: "Panel",                      icon: Home       },
  { id: "transcription",     label: "Atender llamada",            icon: PhoneCall  },
  { id: "companies",         label: "Compañías y disponibilidad", icon: Building2  },
  { id: "gps-tracking",      label: "Seguimiento GPS",            icon: Navigation },
  { id: "report",            label: "Informes",                   icon: FileText   },
];

const CMD_NAV = [
  { id: "cmd-dashboard",  label: "Panel",                 icon: Home    },
  { id: "call-history",   label: "Historial de llamadas", icon: History },
  { id: "daily-roster",   label: "Dotación por día",      icon: Users   },
];

function AppShell({ user, screen, onNavigate, onLogout, children }: {
  user: User; screen: Screen; onNavigate: (s: Screen) => void; onLogout: () => void; children: React.ReactNode;
}) {
  const nav = user.role === "operator" ? OP_NAV : CMD_NAV;
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const isActive = (id: string) => {
    if (id === "transcription") return ["incoming-call", "transcription", "dispatch-breakdown"].includes(screen);
    if (id === "gps-tracking") return screen === "gps-tracking";
    if (id === "report") return screen === "report";
    return screen === id;
  };

  return (
    <div className="h-screen flex bg-[#F4F4F5] overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
      {/* Sidebar */}
      <aside className="w-60 bg-[#2B2B2B] flex flex-col shrink-0">
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10 shrink-0">
          <Logo size={30} />
          <span className="text-white text-lg font-extrabold tracking-tight">OptiFire</span>
        </div>
        <nav className="flex-1 py-4 px-2.5 space-y-0.5 overflow-y-auto">
          {nav.map(item => {
            const Icon = item.icon;
            const active = isActive(item.id);
            return (
              <button key={item.id} onClick={() => onNavigate(item.id as Screen)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${active ? "bg-[#F26522] text-white shadow-md shadow-orange-900/30" : "text-gray-400 hover:bg-white/10 hover:text-white"}`}>
                <Icon size={17} />
                <span className="leading-snug">{item.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-white/10 p-3.5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#F26522] flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white text-xs font-semibold truncate">{user.name}</div>
              <div className="text-gray-500 text-xs">{user.role === "operator" ? "Operador" : "Comandante"}</div>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-red-400 transition-colors p-1" title="Cerrar sesión">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 bg-[#36393F] flex items-center justify-between px-5 shrink-0 border-b border-black/20">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Buscar emergencia, compañía..."
              className="pl-8 pr-4 py-2 bg-white/10 text-white placeholder-gray-500 text-sm rounded-lg border border-white/10 focus:outline-none focus:border-[#F26522] w-60 transition-colors" />
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-500">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              Sesión activa · cierra a las 00:00
            </div>
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => { setShowNotif(v => !v); setShowProfile(false); }}
                className="relative p-2 text-gray-400 hover:text-white transition-colors">
                <Bell size={17} />
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#EF4444] rounded-full" />
              </button>
              {showNotif && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 font-semibold text-sm">Notificaciones</div>
                  {[
                    { icon: PhoneCall, cls: "text-[#F26522]", msg: "Nueva llamada entrante — EMG-0848", time: "Hace 2 min" },
                    { icon: Truck,     cls: "text-[#3B82F6]", msg: "Carro 1ª Compañía llegó a destino", time: "Hace 18 min" },
                    { icon: Clock,     cls: "text-amber-500",  msg: "Sesión expira en 45 minutos",       time: "Hace 15 min" },
                  ].map((n, i) => {
                    const NIcon = n.icon;
                    return (
                      <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0">
                        <NIcon size={15} className={`${n.cls} mt-0.5 shrink-0`} />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm text-gray-800">{n.msg}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{n.time}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Profile */}
            <div className="relative">
              <button onClick={() => { setShowProfile(v => !v); setShowNotif(false); }}
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                <div className="w-7 h-7 rounded-full bg-[#F26522] flex items-center justify-center text-white text-xs font-bold">{user.name.charAt(0)}</div>
                <ChevronDown size={13} />
              </button>
              {showProfile && (
                <div className="absolute right-0 top-11 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-sm text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{user.rut}</div>
                  </div>
                  <button onClick={onLogout} className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors">
                    <LogOut size={14} />Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Operator Dashboard ───────────────────────────────────────────────────────

function OperatorDashboard({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const stats = [
    { label: "Llamadas activas",       value: "2",  sub: "+1 en transcripción",  cls: "text-[#3B82F6]",  bg: "bg-blue-50",   icon: PhoneCall   },
    { label: "Atendidas hoy",          value: "14", sub: "Desde las 00:00 hrs",  cls: "text-[#22C55E]",  bg: "bg-green-50",  icon: CheckCircle },
    { label: "Compañías disponibles",  value: "3",  sub: "de 5 compañías totales",cls: "text-[#F26522]", bg: "bg-orange-50", icon: Building2   },
    { label: "Bomberos en servicio",   value: "27", sub: "Total en dotación activa",cls:"text-gray-700", bg: "bg-gray-100",  icon: Users       },
  ];
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Panel del Operador</h1>
          <p className="text-gray-500 text-sm mt-0.5">Jueves 10 de julio de 2026 · Central de Operaciones RM</p>
        </div>
        <button onClick={() => onNavigate("incoming-call")}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-[#F26522] text-white rounded-xl font-bold text-sm hover:bg-[#d9581f] transition-all shadow-lg shadow-orange-200 active:scale-95">
          <PhoneCall size={18} />Atender llamada entrante
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wide">{s.label}</span>
                <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                  <Icon size={15} className={s.cls} />
                </div>
              </div>
              <div className={`text-3xl font-black font-mono ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-gray-400 mt-1">{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-sm">Emergencias en curso</h2>
            <span className="text-xs text-gray-400">{ACTIVE_EMERGENCIES.length} registros</span>
          </div>
          <div className="divide-y divide-gray-50">
            {ACTIVE_EMERGENCIES.map(e => (
              <div key={e.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="text-xs font-mono text-gray-400 shrink-0 w-20">{e.id}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{e.address}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{e.type}</div>
                </div>
                <SeverityChip sev={e.severity} />
                <StatusChip status={e.status} />
                <div className="text-xs font-mono text-gray-400 shrink-0 text-right">{e.time}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900 text-sm">Estado de compañías</h2>
          </div>
          <div className="p-4 space-y-3">
            {COMPANIES.map(c => (
              <div key={c.id} className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full shrink-0 ${c.status === "disponible" ? "bg-[#22C55E]" : c.status === "sin chofer" ? "bg-[#F59E0B]" : "bg-[#EF4444]"}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-700 truncate">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.crew} bomb. · {c.distance}</div>
                </div>
                <CmpBadge status={c.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Incoming Call ────────────────────────────────────────────────────────────

function IncomingCallScreen({ onAnswer, onReject }: { onAnswer: () => void; onReject: () => void }) {
  const time = useTimer(true);
  return (
    <div className="flex-1 bg-[#18181B] flex items-center justify-center" style={{ fontFamily: "Inter, sans-serif" }}>
      <div className="text-center">
        <div className="relative flex items-center justify-center mb-10">
          <div className="absolute w-52 h-52 rounded-full border-4 border-[#F26522]/15 animate-ping" style={{ animationDuration: "1.8s" }} />
          <div className="absolute w-40 h-40 rounded-full border-4 border-[#F26522]/25 animate-ping" style={{ animationDuration: "1.8s", animationDelay: "0.3s" }} />
          <div className="absolute w-28 h-28 rounded-full bg-[#F26522]/10 animate-pulse" />
          <div className="w-[88px] h-[88px] rounded-full bg-[#F26522] flex items-center justify-center shadow-2xl shadow-orange-600/40 ring-4 ring-orange-500/30">
            <Phone size={38} className="text-white" />
          </div>
        </div>
        <div className="text-[#F26522] text-xs font-bold tracking-[0.2em] uppercase mb-3">Llamada Entrante</div>
        <div className="text-white text-5xl font-extrabold mb-2 tracking-tight">EMG-0848</div>
        <div className="text-gray-500 text-lg mb-2">+56 2 2345 6789</div>
        <div className="font-mono text-gray-400 text-3xl tracking-widest mb-14">{time}</div>
        <div className="flex items-center justify-center gap-10">
          <div className="flex flex-col items-center gap-2">
            <button onClick={onReject}
              className="w-20 h-20 rounded-full bg-[#EF4444] hover:bg-red-500 flex items-center justify-center transition-all shadow-xl shadow-red-600/20 active:scale-95">
              <PhoneOff size={30} className="text-white" />
            </button>
            <span className="text-gray-500 text-xs font-semibold">Rechazar</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={onAnswer}
              className="w-24 h-24 rounded-full bg-[#22C55E] hover:bg-green-500 flex items-center justify-center transition-all shadow-xl shadow-green-600/20 active:scale-95">
              <Phone size={36} className="text-white" />
            </button>
            <span className="text-gray-400 text-sm font-semibold">Atender</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Transcription ────────────────────────────────────────────────────────────

interface CardState {
  detected: boolean; confirmed: boolean; edited: boolean;
  isEditing: boolean; value: string; editVal: string;
}

function TranscriptionScreen({ onDispatch }: { onDispatch: () => void }) {
  const time = useTimer(true);
  const [msgs, setMsgs] = useState<typeof TRANSCRIPT_STEPS>([]);
  const [stepIdx, setStepIdx] = useState(0);
  const [showDecision, setShowDecision] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [cards, setCards] = useState<{ address: CardState; severity: CardState; type: CardState }>({
    address:  { detected: false, confirmed: false, edited: false, isEditing: false, value: "Providencia 1234 esq. Manuel Montt",  editVal: "Providencia 1234 esq. Manuel Montt"  },
    severity: { detected: false, confirmed: false, edited: false, isEditing: false, value: "Grave",                                editVal: "Grave"                                },
    type:     { detected: false, confirmed: false, edited: false, isEditing: false, value: "Incendio estructural",                editVal: "Incendio estructural"                },
  });

  useEffect(() => {
    if (stepIdx >= TRANSCRIPT_STEPS.length) return;
    const delay = stepIdx === 0 ? 800 : 3200;
    const t = setTimeout(() => {
      setMsgs(p => [...p, TRANSCRIPT_STEPS[stepIdx]]);
      if (stepIdx === 1) setCards(c => ({ ...c, address:  { ...c.address,  detected: true } }));
      if (stepIdx === 3) setCards(c => ({ ...c, type:     { ...c.type,     detected: true } }));
      if (stepIdx === 5) setCards(c => ({ ...c, severity: { ...c.severity, detected: true } }));
      setStepIdx(s => s + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [stepIdx]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs]);

  const upd = (k: keyof typeof cards, p: Partial<CardState>) => setCards(c => ({ ...c, [k]: { ...c[k], ...p } }));
  const allDetected = cards.address.detected && cards.severity.detected && cards.type.detected;

  const cardDefs = [
    { key: "address"  as const, label: "Dirección",           icon: MapPin       },
    { key: "severity" as const, label: "Gravedad",            icon: AlertTriangle },
    { key: "type"     as const, label: "Tipo de emergencia",  icon: Flame        },
  ];

  return (
    <div className="flex-1 flex flex-col relative overflow-hidden">
      {/* Status bar */}
      <div className="bg-[#36393F] px-5 py-2.5 flex items-center gap-5 shrink-0 border-b border-black/20">
        <div className="flex items-center gap-2 text-white">
          <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          <span className="text-sm font-semibold">Transcribiendo...</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400 text-sm font-mono">
          <Clock size={13} />{time}
        </div>
        <div className="text-gray-500 text-sm">EMG-0848 · +56 2 2345 6789</div>
        <div className="ml-auto text-xs text-gray-600 flex items-center gap-1.5">
          <Activity size={11} />IA activa — la transcripción nunca se interrumpe
        </div>
      </div>

      {/* Three-zone layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: transcript */}
        <div className="flex-1 flex flex-col bg-white border-r border-gray-200 min-w-0 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <span className="font-semibold text-gray-900 text-sm">Transcripción en vivo</span>
            <span className="text-xs text-[#3B82F6] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] inline-block animate-pulse" />En línea</span>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
            {msgs.map((m, i) => {
              const isOp = m.role === "OPERADOR";
              return (
                <div key={i} className={`flex gap-3 ${isOp ? "flex-row-reverse" : ""}`}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${isOp ? "bg-[#F26522] text-white" : "bg-gray-200 text-gray-600"}`}>
                    {isOp ? "OP" : "LL"}
                  </div>
                  <div className={`max-w-[76%] flex flex-col gap-1 ${isOp ? "items-end" : "items-start"}`}>
                    <div className="text-xs text-gray-400 font-semibold">{isOp ? "Operador" : "Llamante"}</div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${isOp ? "bg-[#F26522]/10 text-gray-800 rounded-tr-sm" : "bg-gray-100 text-gray-800 rounded-tl-sm"}`}>
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })}
            {stepIdx < TRANSCRIPT_STEPS.length && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">LL</div>
                <div className="flex items-center gap-1 px-4 py-3 bg-gray-100 rounded-2xl rounded-tl-sm">
                  {[0, 150, 300].map(d => <div key={d} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: map + data cards */}
        <div className="w-[380px] shrink-0 flex flex-col bg-gray-50 overflow-hidden border-r border-gray-200">
          {/* Map */}
          <div className="h-52 p-3 shrink-0">
            <MapView />
          </div>
          {/* Data cards */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cardDefs.map(({ key, label, icon: Icon }) => {
              const c = cards[key];
              return (
                <div key={key} className={`bg-white rounded-xl border-2 p-4 transition-colors ${c.confirmed || c.edited ? "border-[#22C55E]" : c.detected ? "border-[#F26522]/40" : "border-gray-100"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} className={c.detected ? "text-[#F26522]" : "text-gray-300"} />
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</span>
                    {!c.detected && <span className="ml-auto text-xs text-gray-400 italic">Pendiente...</span>}
                    {c.confirmed && <span className="ml-auto flex items-center gap-1 text-xs text-[#22C55E] font-bold"><CheckCircle size={11} />Confirmado</span>}
                    {c.edited && <span className="ml-auto flex items-center gap-1 text-xs text-[#3B82F6] font-bold"><Edit2 size={11} />Editado</span>}
                  </div>
                  {c.detected && (
                    c.isEditing ? (
                      <div className="flex gap-2 mt-1">
                        <input value={c.editVal} onChange={e => upd(key, { editVal: e.target.value })}
                          className="flex-1 text-sm border-2 border-[#F26522] rounded-lg px-3 py-1.5 focus:outline-none" autoFocus />
                        <button onClick={() => upd(key, { isEditing: false, value: c.editVal, edited: true, confirmed: false })}
                          className="px-3 py-1.5 bg-[#3B82F6] text-white rounded-lg text-xs font-bold">OK</button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold text-gray-800 leading-snug">
                          {key === "severity" ? <SeverityChip sev={c.value.toLowerCase() as Severity} /> : c.value}
                        </div>
                        {!c.confirmed && !c.edited && (
                          <div className="flex gap-1.5 shrink-0">
                            <button onClick={() => upd(key, { confirmed: true })}
                              className="w-7 h-7 bg-green-100 hover:bg-green-200 text-[#22C55E] rounded-lg flex items-center justify-center transition-colors" title="Confirmar dato">
                              <Check size={13} />
                            </button>
                            <button onClick={() => upd(key, { isEditing: true })}
                              className="w-7 h-7 bg-gray-100 hover:bg-gray-200 text-gray-500 rounded-lg flex items-center justify-center transition-colors" title="Editar dato">
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}
                        {(c.confirmed || c.edited) && (
                          <button onClick={() => upd(key, { confirmed: false, edited: false, isEditing: true })}
                            className="w-6 h-6 text-gray-300 hover:text-gray-500 transition-colors flex items-center justify-center">
                            <Edit2 size={12} />
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              );
            })}
          </div>

          {/* Dispatch bar */}
          <div className={`px-3 py-3 shrink-0 border-t transition-colors ${allDetected ? "bg-[#F26522]" : "bg-gray-100 border-gray-200"}`}>
            <button disabled={!allDetected} onClick={() => setShowDecision(true)}
              className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${allDetected ? "bg-white text-[#F26522] hover:bg-orange-50 shadow-md" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}>
              <Zap size={15} />
              {allDetected ? "Datos suficientes — Pasar a despacho" : "Esperando datos mínimos de la IA..."}
            </button>
          </div>
        </div>
      </div>

      {/* Decision overlay */}
      {showDecision && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
            <div className="text-center mb-7">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap size={26} className="text-[#F26522]" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Panel de decisión de despacho</h2>
              <p className="text-gray-500 text-sm mt-1.5">La IA determinó que hay datos suficientes para el despacho.</p>
            </div>
            <div className="space-y-3">
              <button onClick={onDispatch}
                className="w-full py-4 bg-[#F26522] text-white rounded-xl font-bold flex items-center justify-center gap-2.5 hover:bg-[#d9581f] transition-colors shadow-lg shadow-orange-200">
                <Truck size={19} />Proceder con el despacho
              </button>
              <button className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
                <Edit2 size={17} />Editar indicadores de la IA
              </button>
              <button onClick={() => setShowDecision(false)}
                className="w-full py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold flex items-center justify-center gap-2 hover:border-gray-300 transition-colors">
                <PhoneCall size={17} />Continuar transcribiendo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Dispatch Breakdown ───────────────────────────────────────────────────────

function DispatchBreakdown({ onConfirm, onBack }: { onConfirm: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState([1, 2]);
  const rec = COMPANIES.filter(c => [1, 2].includes(c.id));

  const toggle = (id: number) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors p-1"><X size={20} /></button>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Desglose de despacho</h1>
          <p className="text-gray-500 text-sm">EMG-0848 · Incendio estructural · <span className="text-orange-600 font-semibold">Grave</span> · Providencia 1234</p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-start gap-3">
        <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
        <div>
          <div className="font-bold text-amber-800 text-sm">Recomendación de la IA</div>
          <div className="text-amber-700 text-sm mt-0.5">Se recomienda despachar 2 compañías por la gravedad del incendio y personas en riesgo en los pisos superiores.</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {rec.map(c => {
          const sel = selected.includes(c.id);
          return (
            <div key={c.id} onClick={() => toggle(c.id)}
              className={`bg-white rounded-2xl border-2 p-5 cursor-pointer transition-all ${sel ? "border-[#F26522] shadow-lg shadow-orange-100" : "border-gray-200 hover:border-gray-300"}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${sel ? "bg-[#F26522] border-[#F26522]" : "border-gray-300"}`}>
                    {sel && <Check size={12} className="text-white" />}
                  </div>
                  <span className="font-bold text-gray-900 text-sm leading-snug">{c.name}</span>
                </div>
                <CmpBadge status={c.status} />
              </div>
              <div className="grid grid-cols-2 gap-2.5 mb-4">
                {[
                  { label: "Distancia", val: c.distance, cls: "text-gray-900" },
                  { label: "ETA",       val: c.eta,      cls: "text-[#F26522]" },
                  { label: "Dotación",  val: `${c.crew} bomb.`, cls: "text-gray-900" },
                  { label: "Chofer",    val: c.driver ? "Disponible" : "No disponible", cls: c.driver ? "text-[#22C55E]" : "text-[#EF4444]" },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <div className="text-xs text-gray-400 mb-0.5">{item.label}</div>
                    <div className={`font-bold font-mono text-sm ${item.cls}`}>{item.val}</div>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {c.specialty.map(s => <span key={s} className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full text-xs font-semibold">{s}</span>)}
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Justificación IA</div>
                <div className="text-xs text-gray-600 leading-relaxed">
                  {c.id === 1 ? "Compañía más cercana (0.8 km) con especialidad en incendios estructurales, dotación completa y chofer disponible." : "Segunda más cercana con capacidad HAZMAT para materiales peligrosos y chofer disponible en dotación completa."}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button className="px-5 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-semibold hover:border-gray-300 transition-colors flex items-center gap-2 text-sm">
          <Edit2 size={15} />Ajustar selección
        </button>
        <button onClick={onConfirm} disabled={selected.length === 0}
          className="px-7 py-3 bg-[#F26522] text-white rounded-xl font-bold flex items-center gap-2 hover:bg-[#d9581f] transition-colors disabled:opacity-50 shadow-lg shadow-orange-200 text-sm">
          <Send size={15} />Confirmar despacho ({selected.length} compañía{selected.length !== 1 ? "s" : ""})
        </button>
      </div>
    </div>
  );
}

// ─── GPS Tracking ─────────────────────────────────────────────────────────────

function GPSTracking({ onReport }: { onReport: () => void }) {
  const elapsed = useTimer(true);
  const [car1Arrived, setCar1Arrived] = useState(false);
  useEffect(() => { const t = setTimeout(() => setCar1Arrived(true), 12000); return () => clearTimeout(t); }, []);

  const cars = [
    { name: "1ª Compañía Bomba Providencia", eta: "4 min",  arrived: car1Arrived, arrivedAt: "14:36:44", color: "bg-[#F26522]" },
    { name: "3ª Compañía Bomba Santiago",    eta: "7 min",  arrived: false,       arrivedAt: "—",        color: "bg-[#3B82F6]" },
  ];

  return (
    <div className="flex-1 flex overflow-hidden">
      <div className="flex-1 p-4 overflow-hidden">
        <MapView showCars />
      </div>
      <div className="w-80 bg-white border-l border-gray-200 flex flex-col shrink-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <h2 className="font-extrabold text-gray-900">Seguimiento GPS</h2>
          <p className="text-xs text-gray-500 mt-0.5">EMG-0848 · 2 carros desplegados</p>
        </div>
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 shrink-0">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-400">Despacho</div>
              <div className="font-mono font-bold text-gray-900 text-sm">14:32:15</div>
            </div>
            <div>
              <div className="text-xs text-gray-400">Tiempo total</div>
              <div className="font-mono font-bold text-[#F26522] text-sm">{elapsed}</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {cars.map((car, i) => (
            <div key={i} className="p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-3 h-3 rounded-full ${car.arrived ? "bg-[#22C55E]" : `${car.color} animate-pulse`}`} />
                <span className="text-sm font-bold text-gray-900 leading-snug">{car.name}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <div className="text-xs text-gray-400">Estado</div>
                  <div className={`text-sm font-bold capitalize ${car.arrived ? "text-[#22C55E]" : "text-[#F26522]"}`}>{car.arrived ? "Llegó" : "En ruta"}</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-2.5">
                  <div className="text-xs text-gray-400">ETA</div>
                  <div className={`font-mono font-bold text-sm ${car.arrived ? "text-gray-400 line-through" : "text-[#F26522]"}`}>{car.arrived ? car.eta : car.eta}</div>
                </div>
              </div>
              {car.arrived && (
                <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-green-700 font-semibold">
                  <CheckCircle size={13} className="text-[#22C55E]" />
                  Llegada confirmada · {car.arrivedAt}
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-100 shrink-0">
          <button onClick={onReport}
            className="w-full py-3 bg-[#F26522] text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#d9581f] transition-colors shadow-md shadow-orange-200 text-sm">
            <FileText size={16} />Generar informe
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Report ───────────────────────────────────────────────────────────────────

function ReportScreen({ onBack }: { onBack: () => void }) {
  const [fields, setFields] = useState({
    resumen:     "Incendio estructural en edificio de 6 pisos con personas atrapadas en el quinto piso. Llamas visibles en los pisos 3 y 4, humo negro y denso en el área.",
    direccion:   "Providencia 1234 esquina Manuel Montt, Providencia, Santiago RM",
    gravedad:    "Grave",
    tipo:        "Incendio estructural",
    companias:   "1ª Compañía Bomba Providencia, 3ª Compañía Bomba Santiago",
    justif:      "Selección basada en cercanía al siniestro, especialidad en incendios estructurales, dotación completa y chofer disponible.",
    t_despacho:  "14:32:15",
    t_salida:    "14:33:02",
    t_llegada1:  "14:36:44",
    t_llegada3:  "14:39:18",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const F = (key: keyof typeof fields, label: string, multi = false) => (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">{label}</label>
        <button onClick={() => setEditing(editing === key ? null : key)}
          className="text-xs text-[#F26522] hover:underline flex items-center gap-1 font-semibold">
          <Edit2 size={10} />{editing === key ? "Listo" : "Editar"}
        </button>
      </div>
      {editing === key
        ? (multi
          ? <textarea value={fields[key]} onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))} rows={3}
              className="w-full border-2 border-[#F26522] rounded-xl px-3 py-2 text-sm focus:outline-none resize-none" />
          : <input value={fields[key]} onChange={e => setFields(f => ({ ...f, [key]: e.target.value }))}
              className="w-full border-2 border-[#F26522] rounded-xl px-3 py-2 text-sm focus:outline-none" />)
        : <div className="text-sm text-gray-800 bg-gray-50 rounded-xl px-3 py-2.5">{fields[key]}</div>
      }
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-3xl space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-700 transition-colors p-1"><X size={20} /></button>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-gray-900">Informe de emergencia</h1>
            <p className="text-gray-500 text-sm">EMG-0848 · 10 de julio de 2026 · 14:32 hrs</p>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setSaved(true)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors ${saved ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
              {saved ? <><CheckCircle size={15} />Guardado</> : "Guardar en historial"}
            </button>
            <button className="px-5 py-2.5 bg-[#F26522] text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-[#d9581f] transition-colors shadow-md shadow-orange-200">
              <Download size={15} />Descargar DOCX
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
          <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
            <Logo size={36} />
            <div>
              <div className="font-extrabold text-gray-900">OptiFire · Informe de Emergencia</div>
              <div className="text-sm text-gray-500 mt-0.5">N° EMG-0848 · Cuerpo de Bomberos RM</div>
            </div>
            <div className="ml-auto"><SeverityChip sev="grave" /></div>
          </div>
          {F("resumen", "Resumen de la llamada", true)}
          <div className="grid grid-cols-2 gap-4">
            {F("direccion", "Dirección")}
            <div className="grid grid-cols-2 gap-3">
              {F("gravedad", "Gravedad")}
              {F("tipo", "Tipo de emergencia")}
            </div>
          </div>
          {F("companias", "Compañías despachadas")}
          {F("justif", "Justificación de la IA", true)}
          <div>
            <div className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Registro de tiempos</div>
            <div className="grid grid-cols-4 gap-3">
              {(["t_despacho","t_salida","t_llegada1","t_llegada3"] as const).map((k, i) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3">
                  <div className="text-xs text-gray-400 mb-1">{["Despacho","Salida","Llegada 1ª Cía.","Llegada 3ª Cía."][i]}</div>
                  <div className="font-mono font-bold text-gray-900 text-sm">{fields[k]}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Companies ────────────────────────────────────────────────────────────────

function CompaniesScreen() {
  const [fStatus, setFStatus] = useState("todos");
  const [fSpec, setFSpec] = useState("todas");
  const allSpecs = Array.from(new Set(COMPANIES.flatMap(c => c.specialty)));
  const rows = COMPANIES.filter(c => {
    const st = fStatus === "todos" || c.status === fStatus;
    const sp = fSpec === "todas" || c.specialty.includes(fSpec);
    return st && sp;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Compañías y disponibilidad</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fuente de datos para el despacho de IA</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#F26522] text-white rounded-xl text-sm font-bold hover:bg-[#d9581f] transition-colors">
          <RefreshCw size={14} />Actualizar
        </button>
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <Filter size={14} className="text-gray-400" />
        {["todos","disponible","sin chofer","fuera de servicio"].map(s => (
          <button key={s} onClick={() => setFStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${fStatus === s ? "bg-[#F26522] text-white" : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"}`}>
            {s === "todos" ? "Todos" : s}
          </button>
        ))}
        <select value={fSpec} onChange={e => setFSpec(e.target.value)}
          className="ml-2 px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:border-[#F26522] text-gray-600">
          <option value="todas">Todas las especialidades</option>
          {allSpecs.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["Compañía","Estado","Chofer","Bomberos","Especialidades","Distancia","ETA"].map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 text-sm font-semibold text-gray-900">{c.name}</td>
                <td className="px-5 py-4"><CmpBadge status={c.status} /></td>
                <td className="px-5 py-4">
                  <span className={`text-sm font-bold ${c.driver ? "text-[#22C55E]" : "text-[#EF4444]"}`}>{c.driver ? "Sí" : "No"}</span>
                </td>
                <td className="px-5 py-4 text-sm font-mono font-bold text-gray-900">{c.crew}</td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap gap-1">
                    {c.specialty.map(s => <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">{s}</span>)}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{c.distance}</td>
                <td className="px-5 py-4 text-sm font-mono font-bold text-[#F26522]">{c.eta}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={7} className="py-14 text-center text-gray-400 text-sm">No se encontraron compañías con los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Commander Dashboard ──────────────────────────────────────────────────────

function CommanderDashboard({ user, onNavigate }: { user: User; onNavigate: (s: Screen) => void }) {
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Panel del Comandante</h1>
        <p className="text-gray-500 text-sm mt-0.5">Bienvenido/a, {user.name} · Jueves 10 de julio de 2026</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <Shield size={19} className="text-amber-600 shrink-0" />
        <div className="text-sm text-amber-700 font-medium">Acceso de solo consulta. No tiene permisos de despacho ni edición de emergencias activas.</div>
      </div>
      <div className="grid grid-cols-2 gap-5 max-w-xl">
        {[
          { screen: "call-history" as Screen, icon: History, title: "Historial de llamadas", desc: "Registro completo de emergencias atendidas con informes DOCX adjuntos." },
          { screen: "daily-roster" as Screen, icon: Users,   title: "Dotación por día",      desc: "Promedio de bomberos disponibles por compañía y período de fechas." },
        ].map(item => {
          const Icon = item.icon;
          return (
            <button key={item.screen} onClick={() => onNavigate(item.screen)}
              className="bg-white rounded-2xl border-2 border-gray-100 hover:border-[#F26522] p-7 text-left transition-all group shadow-sm hover:shadow-lg">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#F26522] transition-colors">
                <Icon size={22} className="text-[#F26522] group-hover:text-white transition-colors" />
              </div>
              <div className="font-extrabold text-gray-900 text-base mb-1.5">{item.title}</div>
              <div className="text-gray-500 text-sm leading-relaxed">{item.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Call History ─────────────────────────────────────────────────────────────

function CallHistoryScreen() {
  const [search, setSearch] = useState("");
  const [fType, setFType] = useState("todos");
  const types = ["todos", ...Array.from(new Set(CALL_HISTORY.map(c => c.type)))];
  const rows = CALL_HISTORY.filter(c => {
    const sq = !search || c.address.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const tp = fType === "todos" || c.type === fType;
    return sq && tp;
  });
  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Historial de llamadas</h1>
        <p className="text-gray-500 text-sm mt-0.5">Registro de emergencias atendidas — solo lectura</p>
      </div>
      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative min-w-56">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por ID o dirección..."
            className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F26522]" />
        </div>
        <select value={fType} onChange={e => setFType(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F26522] text-gray-600">
          {types.map(t => <option key={t} value={t}>{t === "todos" ? "Todos los tipos" : t}</option>)}
        </select>
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors">
          <Calendar size={13} />Filtrar por fecha
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              {["ID","Fecha / Hora","Dirección","Tipo","Gravedad","Compañías","Resultado","Informe"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {rows.map(c => (
              <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3.5 text-xs font-mono text-gray-400">{c.id}</td>
                <td className="px-4 py-3.5 text-xs font-mono text-gray-600 whitespace-nowrap">{c.date}</td>
                <td className="px-4 py-3.5 text-sm text-gray-800 max-w-[180px] truncate">{c.address}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600 whitespace-nowrap">{c.type}</td>
                <td className="px-4 py-3.5"><SeverityChip sev={c.severity} /></td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{c.companies}</td>
                <td className="px-4 py-3.5 text-sm text-gray-600">{c.result}</td>
                <td className="px-4 py-3.5">
                  <button className="flex items-center gap-1.5 text-xs text-[#F26522] hover:underline font-semibold">
                    <Eye size={12} />Ver DOCX
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-14 text-center text-gray-400 text-sm">No se encontraron registros con los filtros seleccionados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Daily Roster ─────────────────────────────────────────────────────────────

function DailyRosterScreen() {
  const [cmp, setCmp] = useState("todas");
  const showA = cmp === "todas" || cmp === "1a";
  const showB = cmp === "todas" || cmp === "3a";
  const showC = cmp === "todas" || cmp === "5a";

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Dotación disponible por día</h1>
        <p className="text-gray-500 text-sm mt-0.5">Promedio de bomberos disponibles por compañía — solo lectura</p>
      </div>
      <div className="flex gap-3 items-center">
        <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-600 hover:border-gray-300 transition-colors">
          <Calendar size={13} />4 Jul – 10 Jul 2026
        </button>
        <select value={cmp} onChange={e => setCmp(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:border-[#F26522] text-gray-600">
          <option value="todas">Todas las compañías</option>
          <option value="1a">1ª Compañía</option>
          <option value="3a">3ª Compañía</option>
          <option value="5a">5ª Compañía</option>
        </select>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 text-sm mb-4">Bomberos disponibles por día</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={ROSTER_DATA} barGap={4} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#F4F4F5" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#71717A" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #e4e4e7", fontSize: "12px", boxShadow: "0 4px 20px rgba(0,0,0,.08)" }} />
            {showA && <Bar dataKey="1a" name="1ª Compañía" fill="#F26522" radius={[4, 4, 0, 0]} />}
            {showB && <Bar dataKey="3a" name="3ª Compañía" fill="#3B82F6" radius={[4, 4, 0, 0]} />}
            {showC && <Bar dataKey="5a" name="5ª Compañía" fill="#22C55E" radius={[4, 4, 0, 0]} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 font-bold text-sm text-gray-800">Detalle diario</div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Fecha</th>
              {showA && <th className="px-5 py-3 text-right text-xs font-bold text-[#F26522]/70 uppercase tracking-wide">1ª Compañía</th>}
              {showB && <th className="px-5 py-3 text-right text-xs font-bold text-[#3B82F6]/70 uppercase tracking-wide">3ª Compañía</th>}
              {showC && <th className="px-5 py-3 text-right text-xs font-bold text-[#22C55E]/70 uppercase tracking-wide">5ª Compañía</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {ROSTER_DATA.map(row => (
              <tr key={row.date} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-sm text-gray-700">{row.date}</td>
                {showA && <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 text-sm">{row["1a"]}</td>}
                {showB && <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 text-sm">{row["3a"]}</td>}
                {showC && <td className="px-5 py-3 text-right font-mono font-bold text-gray-900 text-sm">{row["5a"]}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [user, setUser] = useState<User | null>(null);

  const nav = (s: Screen) => setScreen(s);

  const handleLogin = (u: User) => { setUser(u); setScreen("role-loading"); };
  const handleLoaded = () => { if (user) setScreen(user.role === "operator" ? "op-dashboard" : "cmd-dashboard"); };
  const handleLogout = () => { setUser(null); setScreen("login"); };

  if (screen === "login") return <LoginScreen onLogin={handleLogin} />;
  if (screen === "role-loading" && user) return <RoleLoadingScreen user={user} onDone={handleLoaded} />;
  if (!user) return <LoginScreen onLogin={handleLogin} />;

  // Full-screen without app shell
  if (screen === "incoming-call") {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ fontFamily: "Inter, sans-serif" }}>
        <IncomingCallScreen onAnswer={() => nav("transcription")} onReject={() => nav("op-dashboard")} />
      </div>
    );
  }

  const content = () => {
    switch (screen) {
      case "op-dashboard":       return <OperatorDashboard onNavigate={nav} />;
      case "transcription":      return <TranscriptionScreen onDispatch={() => nav("dispatch-breakdown")} />;
      case "dispatch-breakdown": return <DispatchBreakdown onConfirm={() => nav("gps-tracking")} onBack={() => nav("transcription")} />;
      case "gps-tracking":       return <GPSTracking onReport={() => nav("report")} />;
      case "report":             return <ReportScreen onBack={() => nav("gps-tracking")} />;
      case "companies":          return <CompaniesScreen />;
      case "cmd-dashboard":      return <CommanderDashboard user={user} onNavigate={nav} />;
      case "call-history":       return <CallHistoryScreen />;
      case "daily-roster":       return <DailyRosterScreen />;
      default:                   return user.role === "operator" ? <OperatorDashboard onNavigate={nav} /> : <CommanderDashboard user={user} onNavigate={nav} />;
    }
  };

  return (
    <AppShell user={user} screen={screen} onNavigate={nav} onLogout={handleLogout}>
      {content()}
    </AppShell>
  );
}
