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
export interface OrbeProps { ramas: RamaOrbe[]; tamano?: number; animado?: boolean; descripcion?: string; className?: string; }
export interface PanelProps { titulo?: string; flecha?: boolean; accion?: string; hondo?: boolean; children?: React.ReactNode; className?: string; }

export declare function Marca(props: MarcaProps): JSX.Element;
export declare function Onda(props: OndaProps): JSX.Element;
export declare function Boton(props: BotonProps): JSX.Element;
export declare function Selector(props: SelectorProps): JSX.Element;
export declare function Pastilla(props: PastillaProps): JSX.Element;
export declare function Perilla(props: PerillaProps): JSX.Element;
export declare function Rama(props: RamaProps): JSX.Element;
export declare function Orbe(props: OrbeProps): JSX.Element;
export declare function Panel(props: PanelProps): JSX.Element;
/** Margen de error en puntos (95 %, p = 0,5): 98 / √voces. */
export declare function margen(voces: number): number | null;
/** Formato chileno: 1.240 · 4,8 */
export declare function cifra(n: number, decimales?: number): string;
