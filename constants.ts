import { Metric, UserProfile } from './types';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Utensils, 
  Activity, 
  User, 
  HeartPulse 
} from 'lucide-react';

export const INITIAL_USER: UserProfile = {
  name: "Arjun",
  age: 27,
  cycleStartAge: 25,
  cycleEndAge: 30,
  currentCycleYear: 3,
  mobile: "+91 98765 43210",
  email: "arjun@example.com",
  birthDate: "1999-05-15"
};

export const MOCK_USERS: UserProfile[] = [
  INITIAL_USER,
  {
    name: "Priya",
    age: 55,
    cycleStartAge: 55,
    cycleEndAge: 60,
    currentCycleYear: 1,
    mobile: "+91 98765 43211",
    email: "priya@example.com",
    birthDate: "1971-08-20"
  },
  {
    name: "Rohan (Child)",
    age: 8,
    cycleStartAge: 5,
    cycleEndAge: 10,
    currentCycleYear: 3,
    mobile: "",
    email: "",
    birthDate: "2018-02-10"
  }
];

export const INITIAL_METRICS: Metric[] = [
  { name: "Weight", unit: "kg", baseline: 75, actual: 76.2, required: 72, category: "Vitals" },
  { name: "Calories", unit: "kcal/day", baseline: 2200, actual: 2450, required: 2100, category: "Macro" },
  { name: "Protein", unit: "g", baseline: 60, actual: 55, required: 80, category: "Macro" },
  { name: "Vitamin D", unit: "ng/mL", baseline: 25, actual: 28, required: 40, category: "Micro" },
  { name: "Heart Rate", unit: "bpm", baseline: 72, actual: 75, required: 65, category: "Organ" },
  { name: "Sleep", unit: "hrs", baseline: 6.5, actual: 6.2, required: 8, category: "Vitals" },
];

export const NAV_ITEMS = [
  { label: 'Home', path: '/', icon: LayoutDashboard },
  { label: 'Progress', path: '/progress', icon: TrendingUp },
  { label: 'Food', path: '/food', icon: Utensils },
  { label: 'Activities', path: '/activities', icon: Activity },
  { label: 'Body', path: '/body', icon: HeartPulse },
  { label: 'Profile', path: '/profile', icon: User },
];