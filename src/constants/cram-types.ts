export interface CramCard {
  id: string;
  course: string;
  topic: string;
  difficulty: 'High Yield' | 'Exam Must-Know' | 'Crucial Formula';
  concept: string;
  recallPrompt: string;
  mnemonic: {
    hook: string;
    explanation: string;
  };
  plainIntuition: string;
  breakdown: string[];
  examTrap: string;
  formulaOrCode?: string;
}

export interface CramDeck {
  id: string;
  title: string;
  courseCode: string;
  description: string;
  cardCount: number;
  estimatedMinutes: number;
  category: string;
  cards: CramCard[];
}

export interface SessionResult {
  deckId: string;
  totalCards: number;
  memorizedIds: string[];
  reviewIds: string[];
  completedAt: Date;
}
