export interface DailyLog {
  _id?: string;
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  problemsSolved: number;
  contestsAttended: number;
  platforms: {
    leetcode: number; // problems solved today
    codechef: number;
    codeforces: number;
    geeksforgeeks: number;
    hackerrank: number;
  };
  habits: {
    gym: boolean;
    dietAdherence: boolean;
    studyHours: number;
  };
  goalMet: boolean; // computed based on threshold (e.g. >= 60%)
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface PhysiqueLog {
  _id?: string;
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  bodyFat?: number;
  createdAt: string | Date;
}

export type ProblemDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface Problem {
  _id?: string;
  id: string;
  userId: string;
  title: string;
  url: string;
  topics: string[];
  notes?: string;
  solutionCode?: string;
  timeSpent?: number; // in minutes
  difficulty: ProblemDifficulty;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface SheetTopic {
  id: string;
  name: string;
  problems: {
    id: string; // typically internal ID for the sheet item
    title: string;
    url?: string;
    difficulty: ProblemDifficulty;
    status: "UNSOLVED" | "SOLVED";
    notes?: string;
  }[];
}

export interface Sheet {
  _id?: string;
  id: string;
  userId: string;
  title: string;
  description?: string;
  topics: SheetTopic[];
  createdAt: string | Date;
  updatedAt?: string | Date;
}
