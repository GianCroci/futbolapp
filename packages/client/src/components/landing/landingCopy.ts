import type { FC } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileText,
  Goal,
  HeartPulse,
  LineChart,
  Map,
  MessageSquare,
  User,
  Users,
} from 'lucide-react';
import { TrainingPreview } from './previews/TrainingPreview';
import { FormationPreview } from './previews/FormationPreview';
import { InsightsPreview } from './previews/InsightsPreview';

/**
 * Single source of truth for ALL landing copy (es-AR, voseo — matches the
 * app's existing tone: "Administrá...", "Iniciar sesión con Google").
 * Component markup must never inline its own user-facing strings.
 */

export interface LandingFeature {
  icon: LucideIcon;
  title: string;
  desc: string;
}

export interface LandingModule {
  id: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  features: LandingFeature[];
  preview: FC;
}

export const landingCopy = {
  brand: 'FutbolApp',
  hero: {
    title:
      'Administrá tus equipos de fútbol: entrenamientos, formaciones y datos con IA',
    subtitle:
      'Planificá entrenamientos, armá formaciones y analizá el rendimiento de tu equipo con IA, todo desde un solo lugar.',
    cta: 'Iniciar sesión con Google',
    error: 'No pudimos iniciar sesión. Probá de nuevo.',
  },
  footer: {
    copyright: (year: number) => `© ${year} FutbolApp`,
  },
} as const;

export const MODULES: LandingModule[] = [
  {
    id: 'entrenamientos',
    icon: ClipboardList,
    title: 'Entrenamientos',
    desc: 'Planificá cada práctica con diagramas tácticos, ejercicios reutilizables y etapas claras.',
    features: [
      {
        icon: CalendarDays,
        title: 'Sesiones de entrenamiento',
        desc: 'Organizá cada práctica con etapas, ejercicios y objetivos.',
      },
      {
        icon: Map,
        title: 'Diagramas de campo',
        desc: 'Dibujá jugadas en la cancha con múltiples diagramas por sesión.',
      },
      {
        icon: FileText,
        title: 'Plantillas de ejercicios',
        desc: 'Guardá y reutilizá tus ejercicios favoritos en un toque.',
      },
    ],
    preview: TrainingPreview,
  },
  {
    id: 'equipo-y-formaciones',
    icon: Users,
    title: 'Equipo y Formaciones',
    desc: 'Armá tu once con arrastrar y soltar, gestioná sustituciones y seguí partidos y lesiones.',
    features: [
      {
        icon: Goal,
        title: 'Formaciones',
        desc: 'Armá tu once con arrastrar y soltar.',
      },
      {
        icon: User,
        title: 'Jugadores',
        desc: 'Cargá tu plantel con datos y posiciones.',
      },
      {
        icon: CalendarDays,
        title: 'Fixture',
        desc: 'Seguí los partidos del torneo y sus resultados.',
      },
      {
        icon: HeartPulse,
        title: 'Lesiones',
        desc: 'Llevá el seguimiento de tus jugadores lesionados.',
      },
    ],
    preview: FormationPreview,
  },
  {
    id: 'datos-e-ia',
    icon: LineChart,
    title: 'Datos e IA',
    desc: 'Convertí cada partido en datos accionables con estadísticas y análisis con IA.',
    features: [
      {
        icon: BarChart3,
        title: 'Estadísticas',
        desc: 'Compará el rendimiento con gráficos claros.',
      },
      {
        icon: MessageSquare,
        title: 'Análisis con IA',
        desc: 'Chateá con tus datos y obtené insights del equipo.',
      },
      {
        icon: FileBarChart,
        title: 'Informes y exportación',
        desc: 'Exportá informes para compartir con tu cuerpo técnico.',
      },
    ],
    preview: InsightsPreview,
  },
];
