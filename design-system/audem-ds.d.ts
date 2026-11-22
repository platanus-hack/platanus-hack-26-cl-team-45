import * as React from 'react';

export interface MarcaProps { tamano?: number; segunda?: string; simbolo?: boolean; className?: string; }
export interface OndaProps { alto?: number; className?: string; }
export interface BotonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'contorno' | 'grabar';
  /** Solo con variante "grabar": está grabando. */
  activo?: boolean;
}
export type Opcion = string | { valor: string; etiqueta: string };
export interface SelectorProps { opciones: Opcion[]; valor?: string; valorInicial?: string; onChange?: (valor: string) => void; etiqueta?: string; className?: string; }
export interface PastillaProps { tono?: 'coral' | 'turquesa' | 'lila' | 'neutro'; children: React.ReactNode; className?: string; }
export interface PerillaProps { valor: number; min?: number; max?: number; texto?: string; etiqueta?: string; tamano?: number; className?: string; }
export type EstadoRama = 'provisional' | 'validada' | 'minoritaria';
export interface RamaProps { texto: string; porcentaje: number; voces?: number; margen?: number; estado?: EstadoRama; className?: string; }
export interface RamaOrbe { etiqueta?: string; detalle?: string; /** 0 a 1 */ peso?: number; estado?: EstadoRama; }
export interface OrbeProps { ramas: RamaOrbe[]; tamano?: number; animado?: boolean; minimal?: boolean; pensando?: boolean; descripcion?: string; className?: string; }
export interface PanelProps { titulo?: string; flecha?: boolean; accion?: string; hondo?: boolean; children?: React.ReactNode; className?: string; }

export interface Cita { texto: string; fuente?: string; }
export interface FilaDiagnostico { etiqueta: string; valor: string; estado?: 'ok' | 'alerta' | 'info'; }
export interface RespuestaAgente { texto?: string; citas?: Cita[]; ramas?: RamaProps[]; diagnostico?: FilaDiagnostico[]; accion?: { etiqueta: string; onClick?: () => void }; base?: string; }
export type Mensaje = { de: 'persona'; texto: string } | ({ de: 'agente' } & RespuestaAgente);
export type ModoAgente = 'consultar' | 'diagnosticar';
export interface AgenteProps { mensajes?: Mensaje[]; onEnviar?: (texto: string, modo: ModoAgente) => void; pensando?: boolean | string; sugerencias?: string[] | Partial<Record<ModoAgente, string[]>>; onCerrar?: () => void; modos?: boolean; modoInicial?: ModoAgente; avatar?: boolean; titulo?: string; className?: string; }
export interface EntradaProps { onEnviar?: (texto: string) => void; placeholder?: string; deshabilitado?: boolean; pensando?: boolean; avatar?: boolean; etiqueta?: string; className?: string; }
export interface EscenaProps { ramas: RamaOrbe[]; descripcion?: string; animado?: boolean; responder?: (texto: string, modo: ModoAgente) => RespuestaAgente | Promise<RespuestaAgente | null> | null; agente?: Partial<AgenteProps>; mensajes?: Mensaje[]; abierto?: boolean; alto?: number; saludo?: string; pregunta?: string; pie?: string; etiquetaActivar?: string; className?: string; }
export type EstadoVoz = 'reposo' | 'grabando' | 'procesando' | 'listo' | 'error';
export interface BotonVozProps { estado?: EstadoVoz; /** volumen 0 a 1 */ nivel?: number; /** tiempo usado 0 a 1 */ progreso?: number; onClick?: () => void; tamano?: number; etiqueta?: string; className?: string; }
export interface MicrofonoProps { pregunta?: string; tema?: string; limite?: number; onGrabar?: () => void; onTerminar?: (segundos: number) => Promise<{ texto?: string } | void> | void; onEnviarTexto?: (texto: string) => Promise<{ texto?: string } | void> | void; nivel?: number; voces?: Array<string | { texto: string }>; estado?: EstadoVoz; estadoInicial?: EstadoVoz; onEstado?: (estado: EstadoVoz) => void; tamano?: number; className?: string; }

export declare function Marca(props: MarcaProps): JSX.Element;
export declare function Onda(props: OndaProps): JSX.Element;
export declare function Boton(props: BotonProps): JSX.Element;
export declare function Selector(props: SelectorProps): JSX.Element;
export declare function Pastilla(props: PastillaProps): JSX.Element;
export declare function Perilla(props: PerillaProps): JSX.Element;
export declare function Rama(props: RamaProps): JSX.Element;
export declare function Orbe(props: OrbeProps): JSX.Element;
export declare function Panel(props: PanelProps): JSX.Element;
export declare function Agente(props: AgenteProps): JSX.Element;
export declare function Escena(props: EscenaProps): JSX.Element;
export declare function Entrada(props: EntradaProps): JSX.Element;
export declare function BotonVoz(props: BotonVozProps): JSX.Element;
export declare function Microfono(props: MicrofonoProps): JSX.Element;
/** Margen de error en puntos (95 %, p = 0,5): 98 / √voces. */
export declare function margen(voces: number): number | null;
/** Formato chileno: 1.240 · 4,8 */
export declare function cifra(n: number, decimales?: number): string;
