export interface Student {
  _id: string;
  name: string;
  registrationNo: string;
  contactNo: string;
  badNo: string;
  hostelName: Hostel;
  defaultFoodPref: FoodType;
  isActive: boolean;
  createdAt: string;
}

export interface Management {
  _id: string;
  name: string;
  email: string;
  hostelName: Hostel | null;
  role: 'hostel_admin' | 'super_admin';
}

export type Hostel = 'RHR' | 'APJ' | 'KHR' | 'KCHR';
export type FoodType = 'veg' | 'nonveg';
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPref {
  selected: boolean;
  type?: FoodType;
}

export interface FoodPreference {
  _id: string;
  student: string;
  hostelName: Hostel;
  date: string;
  breakfast: { selected: boolean };
  lunch: MealPref;
  dinner: MealPref;
  isAutoFilled: boolean;
}

export interface QRData {
  image: string;
  token: string;
  mealType: MealType;
  date: string;
  expiresIn: number;
  student: {
    name: string;
    registrationNo: string;
    hostelName: Hostel;
    badNo: string;
  };
}

export interface MealCounts {
  breakfast: { selected: number; notSelected: number };
  lunch: { veg: number; nonveg: number; notSelected: number };
  dinner: { veg: number; nonveg: number; notSelected: number };
}

export interface NotEatenEntry {
  _id: string;
  name: string;
  registrationNo: string;
  badNo: string;
}

export interface DashboardData {
  hostelName: Hostel;
  date: string;
  totalStudents: number;
  counts: MealCounts;
  notEaten: {
    breakfast: { count: number; students: NotEatenEntry[] };
    lunch: { count: number; students: NotEatenEntry[] };
    dinner: { count: number; students: NotEatenEntry[] };
  };
}

export interface ScanResult {
  success: boolean;
  message: string;
  student?: {
    name: string;
    registrationNo: string;
    badNo: string;
    hostelName: Hostel;
  };
  meal?: {
    type: MealType;
    foodType: string;
    serveLabel: string;
  };
  scannedAt?: string;
}

export interface AuthState {
  token: string | null;
  studentUser: Student | null;
  adminUser: Management | null;
  userType: 'student' | 'management' | null;
}