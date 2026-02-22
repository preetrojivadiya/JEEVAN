export interface UserProfile {
  name: string;
  age: number;
  cycleStartAge: number;
  cycleEndAge: number;
  currentCycleYear: number;
  mobile?: string;
  email?: string;
  birthDate?: string;
}

export interface Metric {
  name: string;
  unit: string;
  baseline: number;
  actual: number;
  required: number;
  category: 'Vitals' | 'Macro' | 'Micro' | 'Organ';
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'FOOD' | 'ACTIVITY';
  description: string;
  metricsImpact: Record<string, number>;
  baseMetrics?: Record<string, number>; // Per unit metrics
  quantity?: number;
  imageUrl?: string;
  time?: string; // For templates
  activityDetails?: {
    sets: number;
    reps: number[];
  };
}

export interface MealTemplate {
  id: string;
  name: string;
  items: LogEntry[];
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  items: LogEntry[];
}

export interface HealthRecords {
  nutrients: {
    macros: { carbs: number; protein: number; fats: number };
    vitamins: Record<string, number>; // A, D, E, K, B1-B12, C
    minerals: Record<string, number>; // Calcium, Zinc, Iron, etc.
  };
  organs: {
    eyes: { leftFar: number; rightFar: number; leftClose: number; rightClose: number };
    heart: { bpSystolic: number; bpDiastolic: number; cholesterol: number; bmi: number };
    lungs: { fvc: number; fev1: number; lungVolume: number; pef: number };
    liver: { alt: number; ast: number; alp: number; ggt: number; bilirubin: number };
  };
  other: {
    bio: { age: number; weight: number; height: number };
    environment: { location: string; aqi: number; temperature: number; uvLevel: number };
  };
}

export interface CustomFood {
  id: string;
  name: string;
  metrics: Record<string, number>;
}

export interface AppState {
  user: UserProfile;
  metrics: Metric[];
  logs: LogEntry[];
  templates: MealTemplate[];
  workoutTemplates: WorkoutTemplate[];
  customFoods: CustomFood[];
  healthRecords: HealthRecords; 
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  addLog: (log: LogEntry) => void;
  updateLog: (id: string, updates: Partial<LogEntry>) => void;
  removeLog: (id: string) => void;
  addTemplate: (template: MealTemplate) => void;
  updateTemplate: (id: string, template: MealTemplate) => void;
  addWorkoutTemplate: (template: WorkoutTemplate) => void;
  removeWorkoutTemplate: (id: string) => void;
  addCustomFood: (food: CustomFood) => void;
  updateCustomFood: (id: string, food: CustomFood) => void;
  removeCustomFood: (id: string) => void;
  updateHealthRecords: (records: Partial<HealthRecords>) => void; 
  updateMetrics: (newMetrics: Metric[]) => void;
  updateMetricGoal: (name: string, value: number) => void;
  switchUser: (user: UserProfile) => void;
  updateUserProfile: (updates: Partial<UserProfile>) => void;
  logout: () => void;
}