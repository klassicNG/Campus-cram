import { CramDeck } from '../constants/cram-types';
import { SAMPLE_CRAM_DECKS } from '../constants/sample-cram-decks';
import { TheoryExamPaper, FUTMINNA_SAMPLE_EXAM } from '../constants/sample-theory-exams';

export interface ExamQuestion {
  id: string | number;
  topic?: string;
  question: string;
  options: string[] | { id?: string; text?: string; correct?: boolean }[];
  correctAnswer: string;
  explanation?: string;
}

// ---------------------------------------------------------------------------
// Pre-seeded CBT Exam Questions for Library Courses
// ---------------------------------------------------------------------------

const CSC301_CBT_EXAM: ExamQuestion[] = [
  {
    id: 1,
    topic: 'Deadlock Avoidance',
    question: 'Under Bankers Algorithm, what condition is strictly required for a state to be classified as "Safe"?',
    options: [
      'Total available resources exceed currently allocated resources.',
      'There exists at least one safe sequence in which all processes can obtain required resources and terminate without deadlock.',
      'No processes currently hold mutual exclusion locks.',
      'All process requests can be satisfied concurrently in a single CPU cycle.',
    ],
    correctAnswer: 'B',
    explanation: 'A state is safe if there exists a safe sequence <P1, P2, ..., Pn> such that for each Pi, the resources Pi still needs can be satisfied by current available resources plus resources held by all prior Pj.',
  },
  {
    id: 2,
    topic: 'Virtual Memory & Paging',
    question: 'When a Translation Lookaside Buffer (TLB) misses, where does the Memory Management Unit (MMU) look next?',
    options: [
      'Secondary Swap Disk',
      'The Page Table stored in Physical RAM',
      'CPU L1 Cache',
      'Direct Memory Access (DMA) Controller',
    ],
    correctAnswer: 'B',
    explanation: 'On a TLB miss, the MMU accesses the page table in main memory to translate the virtual page number to a physical frame number, then populates the TLB.',
  },
  {
    id: 3,
    topic: 'Process Synchronization',
    question: 'What is the key difference between a Binary Semaphore and a Mutex lock?',
    options: [
      'Semaphores operate in user space while mutexes run exclusively in kernel mode.',
      'A Mutex includes ownership semantics: only the thread that acquired the mutex can release it, whereas any thread can signal a semaphore.',
      'Semaphores cannot prevent race conditions whereas mutexes eliminate deadlock automatically.',
      'A Mutex supports arbitrary integer counters while a binary semaphore only holds 0 or 1.',
    ],
    correctAnswer: 'B',
    explanation: 'A mutex is an ownership lock; only the acquiring thread is permitted to unlock it. A semaphore is a signaling mechanism where any cooperating thread or ISR can signal wait/post.',
  },
  {
    id: 4,
    topic: 'CPU Scheduling',
    question: 'Which CPU scheduling algorithm minimizes average waiting time for a given set of stationary processes?',
    options: [
      'Round Robin (RR)',
      'Shortest Job First (SJF / Shortest Remaining Time First)',
      'First-Come First-Served (FCFS)',
      'Priority Scheduling with Aging',
    ],
    correctAnswer: 'B',
    explanation: 'SJF is provably optimal with respect to minimizing average waiting time because moving a shorter process ahead of a longer one decreases waiting time more than it increases waiting time for the longer one.',
  },
  {
    id: 5,
    topic: 'Thrashing & Working Set',
    question: 'What characterizes the phenomenon of "Thrashing" in an operating system?',
    options: [
      'The CPU overheating due to continuous floating-point instructions.',
      'The operating system spending more time swapping pages in and out of secondary storage than executing actual application instructions.',
      'Corrupted partition tables causing kernel panic during bootstrap.',
      'Two processes simultaneously executing atomic test-and-set operations.',
    ],
    correctAnswer: 'B',
    explanation: 'Thrashing occurs when the sum of working set sizes across all active processes exceeds available physical memory, causing continuous page faults and severe CPU utilization drop.',
  },
];

const SEN301_CBT_EXAM: ExamQuestion[] = [
  {
    id: 1,
    topic: 'SOLID Principles',
    question: 'Which SOLID principle is directly violated when a subclass overrides a base class method by throwing an "UnsupportedOperationException"?',
    options: [
      'Single Responsibility Principle (SRP)',
      'Liskov Substitution Principle (LSP)',
      'Open/Closed Principle (OCP)',
      'Interface Segregation Principle (ISP)',
    ],
    correctAnswer: 'B',
    explanation: 'LSP dictates that functions using pointers or references to base classes must be able to use objects of derived classes without knowing the difference or encountering unexpected exceptions.',
  },
  {
    id: 2,
    topic: 'Design Patterns',
    question: 'You need to allow users to add dynamic scrolling, borders, and shadows to visual elements at runtime without altering existing component classes. Which GoF pattern fits best?',
    options: [
      'Decorator Pattern',
      'Facade Pattern',
      'Singleton Pattern',
      'Adapter Pattern',
    ],
    correctAnswer: 'A',
    explanation: 'The Decorator pattern attaches additional responsibilities to an object dynamically. Decorators provide a flexible alternative to subclassing for extending functionality.',
  },
  {
    id: 3,
    topic: 'Distributed Systems',
    question: 'According to the CAP Theorem, when an unavoidable network partition (P) occurs in a distributed database, what architectural trade-off must be made?',
    options: [
      'Choose between Latency and Throughput.',
      'Choose between Consistency (C) and Availability (A).',
      'Sacrifice both ACID and BASE guarantees completely.',
      'Switch automatically from SQL to NoSQL columnar storage.',
    ],
    correctAnswer: 'B',
    explanation: 'Since real networks will inevitably experience partitions, distributed systems must trade off between returning the most recent consistent write (C) or guaranteeing every node returns a response (A).',
  },
  {
    id: 4,
    topic: 'Clean Architecture',
    question: 'In Clean Architecture (Uncle Bob), what is the foundational rule governing the direction of source code dependencies?',
    options: [
      'Dependencies must point outward toward database drivers and UI frameworks.',
      'Dependencies must only point inward toward higher-level policies and core business entities.',
      'Entities must depend directly on database ORM models for performance.',
      'Controllers and Use Cases must reside in the same layer to eliminate abstraction overhead.',
    ],
    correctAnswer: 'B',
    explanation: 'The Dependency Rule states that source code dependencies can only point inward. Nothing in an inner circle can know anything at all about something in an outer circle.',
  },
];

const MTH301_CBT_EXAM: ExamQuestion[] = [
  {
    id: 1,
    topic: 'Root Finding Methods',
    question: 'What is the order of convergence of the Newton-Raphson method near a simple root?',
    options: [
      'Linear (Order 1)',
      'Quadratic (Order 2)',
      'Cubic (Order 3)',
      'Superlinear (Order 1.618)',
    ],
    correctAnswer: 'B',
    explanation: 'The Newton-Raphson method exhibits quadratic convergence (order 2) near a simple root, meaning the number of correct decimal digits approximately doubles with each iteration.',
  },
  {
    id: 2,
    topic: 'Numerical Integration',
    question: 'How many subintervals are required to apply Simpson 1/3 Rule, and what polynomial degree does it interpolate?',
    options: [
      'Odd number of subintervals; linear polynomial.',
      'Even number of subintervals (n % 2 == 0); quadratic (degree 2) parabola.',
      'Multiples of 3 subintervals; cubic polynomial.',
      'Arbitrary number of subintervals; exponential function.',
    ],
    correctAnswer: 'B',
    explanation: 'Simpson 1/3 rule fits parabolas across pairs of intervals; thus it strictly requires an even number of subintervals (or an odd number of node points).',
  },
  {
    id: 3,
    topic: 'Differential Equations',
    question: 'Compared to Euler Method, why is the 4th-Order Runge-Kutta (RK4) method preferred for initial value problems?',
    options: [
      'RK4 avoids calculating any function evaluations.',
      'RK4 has a local truncation error of O(h⁵) and global error of O(h⁴), delivering vastly superior accuracy and stability for a given step size h.',
      'Euler method only works for complex eigenvalues.',
      'RK4 does not require boundary initial conditions.',
    ],
    correctAnswer: 'B',
    explanation: 'Euler is a 1st-order method with global error O(h). RK4 samples 4 slopes across the interval, achieving 4th-order global convergence O(h⁴).',
  },
];

const CSC305_CBT_EXAM: ExamQuestion[] = [
  {
    id: 1,
    topic: 'Database Normalization',
    question: 'A relation is in Boyce-Codd Normal Form (BCNF) if and only if for every non-trivial functional dependency X -> Y:',
    options: [
      'Y is a prime attribute.',
      'X is a superkey of the relation.',
      'X and Y belong to the same composite index.',
      'No multi-valued dependencies exist.',
    ],
    correctAnswer: 'B',
    explanation: 'BCNF is a stricter version of 3NF. In BCNF, the left-hand determinant X must be a superkey for every non-trivial functional dependency X -> Y.',
  },
  {
    id: 2,
    topic: 'Transaction Concurrency',
    question: 'Under Two-Phase Locking (2PL), what occurs during the "Shrinking Phase"?',
    options: [
      'The transaction acquires new read locks while releasing write locks.',
      'The transaction releases locks and cannot acquire any new locks of any kind.',
      'The transaction rolls back immediately due to deadlock.',
      'The database compresses log files to disk.',
    ],
    correctAnswer: 'B',
    explanation: 'Strict 2PL guarantees serializability by dividing lock operations into a Growing Phase (only acquiring locks) and a Shrinking Phase (only releasing locks; no new locks permitted).',
  },
  {
    id: 3,
    topic: 'Relational Algebra',
    question: 'Which relational algebra operation represents the set of all tuples that are in relation R but not in relation S (requiring union compatibility)?',
    options: [
      'Cartesian Product (R × S)',
      'Set Difference (R - S)',
      'Natural Join (R ⋈ S)',
      'Projection (π)',
    ],
    correctAnswer: 'B',
    explanation: 'Set Difference (R - S) selects tuples in R that do not appear in S. Both relations must be union-compatible (identical degree and compatible attribute domains).',
  },
];

// ---------------------------------------------------------------------------
// Pre-seeded Theory Exam Papers for Library Courses
// ---------------------------------------------------------------------------

const CSC301_THEORY_PAPER: TheoryExamPaper = {
  id: 'theory-csc301',
  institution: 'FACULTY OF COMPUTING & SYSTEMS',
  facultyOrSchool: 'Department of Computer Science',
  department: 'Computer Science',
  academicSession: '2024/2025 Harmattan Semester',
  semester: 'First Semester Examination',
  courseCode: 'CSC 301',
  courseTitle: 'Operating Systems & Concurrency Architecture',
  creditUnits: 3,
  timeAllowedMinutes: 120,
  instructions: 'Answer any THREE (3) questions. Neat sketches of process state transitions and clear tabular Bankers safety proofs are awarded full marks.',
  questions: [
    {
      id: 1,
      questionNumber: 1,
      topic: 'Deadlock Avoidance & Bankers Algorithm',
      totalMarks: 20,
      instructions: 'Provide step-by-step vector arithmetic and safety matrix proofs.',
      subQuestions: [
        {
          id: '1a',
          label: '(a)',
          prompt: 'Differentiate between Deadlock Prevention and Deadlock Avoidance. State the four Coffman conditions necessary for deadlock.',
          marks: 6,
          rubricKeyPoints: [
            'Mutual Exclusion definition and invalidation strategy',
            'Hold and Wait condition definition and release heuristic',
            'No Preemption definition and CPU context saving',
            'Circular Wait condition and resource ordering numbering scheme',
            'Clear distinction: Prevention eliminates conditions statically; Avoidance monitors dynamically via state transitions',
          ],
        },
        {
          id: '1b',
          label: '(b)',
          prompt: 'A system has 5 processes (P0 to P4) and 3 resource types A (10 instances), B (5 instances), and C (7 instances). Given Allocation and Max matrices, determine if the system is currently in a safe state and compute the complete safe sequence.',
          marks: 8,
          rubricKeyPoints: [
            'Accurate calculation of Need Matrix: Need[i] = Max[i] - Allocation[i]',
            'Accurate computation of Available Vector: Total - Sum(Allocated)',
            'Iterative verification of Need <= Work for each candidate process',
            'Correctly derived safe sequence (e.g. <P1, P3, P4, P0, P2>)',
            'Explicit mathematical conclusion affirming absence of deadlock vulnerability',
          ],
        },
        {
          id: '1c',
          label: '(c)',
          prompt: 'Rigorously prove why imposing a global strict total ordering on all resource types provably prevents the Circular Wait Coffman condition.',
          marks: 6,
          rubricKeyPoints: [
            'Definition of one-to-one indexing function F: R -> N',
            'Proof by contradiction: Assume a cycle exists Pi -> Pi+1 -> ... -> P0',
            'Derivation of impossible strict inequality F(R_i) < F(R_j) < ... < F(R_i)',
            'Conclusion establishing mathematical impossibility of circular chain',
          ],
        },
      ],
    },
    {
      id: 2,
      questionNumber: 2,
      topic: 'Virtual Memory & Page Replacement',
      totalMarks: 20,
      instructions: 'Show full frame trace tables for reference strings.',
      subQuestions: [
        {
          id: '2a',
          label: '(a)',
          prompt: 'Explain the mechanism of a Translation Lookaside Buffer (TLB) and compute Effective Memory Access Time (EMAT) given hit ratio = 92%, TLB search = 10ns, and RAM access = 100ns.',
          marks: 6,
          rubricKeyPoints: [
            'Diagram or description of MMU, Virtual Address, TLB cache, and Page Table in RAM',
            'Formula: EMAT = HitRatio * (TLB + RAM) + (1 - HitRatio) * (TLB + 2 * RAM)',
            'Correct arithmetic substitution: 0.92*(110) + 0.08*(210) = 101.2 + 16.8 = 118 ns',
            'Explanation of why a miss incurs two memory references',
          ],
        },
        {
          id: '2b',
          label: '(b)',
          prompt: 'Compare FIFO, LRU, and Optimal Page Replacement on reference string: 7, 0, 1, 2, 0, 3, 0, 4, 2, 3 with 3 frames. State what Belady Anomaly is.',
          marks: 8,
          rubricKeyPoints: [
            'Accurate trace of frame allocations for FIFO, LRU, and OPT',
            'Total page fault counts computed for each algorithm',
            'Belady Anomaly definition: FIFO can cause more faults with more frames',
            'Stack algorithm property explaining why LRU and OPT never exhibit Belady Anomaly',
          ],
        },
        {
          id: '2c',
          label: '(c)',
          prompt: 'Define Thrashing and explain how Denning Working Set Model (W(t, delta)) dynamically allocates page frames to prevent CPU collapse.',
          marks: 6,
          rubricKeyPoints: [
            'Thrashing definition: paging overhead exceeding productive computation time',
            'Working Set definition: set of pages referenced in the most recent delta time window',
            'Admission criteria: sum of Working Set sizes <= total physical frames',
            'Process suspension heuristic when frame demand exceeds capacity',
          ],
        },
      ],
    },
  ],
};

const SEN301_THEORY_PAPER: TheoryExamPaper = {
  id: 'theory-sen301',
  institution: 'FACULTY OF ENGINEERING & TECHNOLOGY',
  facultyOrSchool: 'Software Engineering Department',
  department: 'Software Engineering',
  academicSession: '2024/2025 Session',
  semester: 'First Semester Examination',
  courseCode: 'SEN 301',
  courseTitle: 'Software Engineering Architecture & Design Patterns',
  creditUnits: 3,
  timeAllowedMinutes: 120,
  instructions: 'Answer all questions. Provide UML class structure diagrams and code fragments where applicable.',
  questions: [
    {
      id: 1,
      questionNumber: 1,
      topic: 'Clean Architecture & SOLID',
      totalMarks: 20,
      subQuestions: [
        {
          id: '1a',
          label: '(a)',
          prompt: 'Analyze the Liskov Substitution Principle (LSP) and Interface Segregation Principle (ISP) with illustrative code examples violating and adhering to each.',
          marks: 6,
          rubricKeyPoints: [
            'LSP mathematical definition: Subtypes must preserve invariants of supertypes',
            'Classic Rectangle vs Square violation explanation with code',
            'ISP definition: Clients should not be forced into fat interfaces',
            'Interface partitioning refactoring demonstration',
          ],
        },
        {
          id: '1b',
          label: '(b)',
          prompt: 'Draw and explain the concentric circles of Clean Architecture. Explain how the Dependency Inversion Principle protects enterprise business rules from UI and Database changes.',
          marks: 8,
          rubricKeyPoints: [
            'Four concentric rings: Entities, Use Cases, Interface Adapters, Frameworks/Drivers',
            'The Dependency Rule: Dependencies point strictly inward',
            'Use of Repository Interfaces in the Use Case layer implemented in the Infrastructure layer',
            'Decoupling business logic from database schema modifications',
          ],
        },
        {
          id: '1c',
          label: '(c)',
          prompt: 'Compare the Abstract Factory and Factory Method design patterns. Provide a UML structural sketch and explain which pattern is better suited when supporting multiple cross-platform UI widget toolkits.',
          marks: 6,
          rubricKeyPoints: [
            'Factory Method: relies on inheritance; subclasses decide which concrete class to instantiate',
            'Abstract Factory: relies on composition; provides interface for creating families of related objects',
            'UML diagram showing AbstractFactory, ConcreteFactory1/2, AbstractProductA/B',
            'Justification of Abstract Factory for cross-platform UI (e.g. Windows vs Mac widgets)',
          ],
        },
      ],
    },
  ],
};

// ---------------------------------------------------------------------------
// Pre-seeded Cram Decks for Library Courses (MTH 301 & CSC 305 additions)
// ---------------------------------------------------------------------------

const MTH301_CRAM_DECK: CramDeck = {
  id: 'deck-mth301',
  title: 'Numerical Methods & Algorithms',
  courseCode: 'MTH 301',
  description: 'High-yield root finding formulas, numerical integration bounds, and matrix iteration theorems.',
  cardCount: 4,
  estimatedMinutes: 5,
  category: 'Mathematics',
  cards: [
    {
      id: 'mth301-c1',
      course: 'MTH 301',
      topic: 'ROOT FINDING',
      difficulty: 'Crucial Formula',
      concept: 'Newton-Raphson Iteration & Convergence',
      recallPrompt: 'What is the recurrence relation for Newton-Raphson and under what condition does it fail catastrophically?',
      mnemonic: {
        hook: 'X_new = X_old - f / f-prime',
        explanation: 'Step down the tangent slope: next x is current x minus function value divided by derivative.',
      },
      plainIntuition: 'You draw a tangent line from your current guess down to the x-axis, and your next guess is where the tangent hits zero.',
      breakdown: [
        '• Formula: x_{n+1} = x_n - f(x_n) / f\'(x_n)',
        '• Convergence: Quadratic (order 2) for simple roots (error e_{n+1} ≈ C · e_n²).',
        '• Pitfall: Fails when f\'(x_n) ≈ 0 (horizontal tangent shoots guess to infinity) or cycles endlessly.',
      ],
      examTrap: 'If f\'(root) = 0 (multiple root), Newton-Raphson drops from quadratic convergence down to slow linear convergence!',
      formulaOrCode: 'x_{n+1} = x_n - \\frac{f(x_n)}{f\'(x_n)}',
    },
    {
      id: 'mth301-c2',
      course: 'MTH 301',
      topic: 'NUMERICAL INTEGRATION',
      difficulty: 'High Yield',
      concept: 'Trapezoidal vs Simpson Rules',
      recallPrompt: 'What are the error terms and interval requirements for Trapezoidal vs Simpson 1/3 Rule?',
      mnemonic: {
        hook: 'Trap = Degree 1 (O(h²)), Simp 1/3 = Degree 2 (O(h⁴))',
        explanation: 'Trapezoid connects points with straight lines; Simpson 1/3 fits parabolas across pairs of subintervals.',
      },
      plainIntuition: 'Simpson is like bending a flexible wire to fit 3 points instead of cutting rigid straight sticks, giving far better curvature tracking.',
      breakdown: [
        '• Trapezoidal: Error O(h² · f\'\'(ξ)). Requires at least 1 interval.',
        '• Simpson 1/3: Error O(h⁴ · f⁽⁴⁾(ξ)). Strictly requires an EVEN number of intervals (n % 2 == 0).',
        '• Simpson 3/8: Fits cubic polynomials across intervals divisible by 3.',
      ],
      examTrap: 'Applying Simpson 1/3 to an odd number of intervals is an automatic zero in exams. If intervals are odd, combine Simpson 1/3 with a single Trapezoidal end-panel.',
    },
  ],
};

const CSC305_CRAM_DECK: CramDeck = {
  id: 'deck-csc305',
  title: 'Database Systems & Normalization',
  courseCode: 'CSC 305',
  description: '1NF to BCNF rules, lossless decomposition proofs, and ACID transactional concurrency.',
  cardCount: 4,
  estimatedMinutes: 5,
  category: 'Computer Science',
  cards: [
    {
      id: 'csc305-c1',
      course: 'CSC 305',
      topic: 'NORMALIZATION',
      difficulty: 'Exam Must-Know',
      concept: '1NF -> 2NF -> 3NF -> BCNF Ladder',
      recallPrompt: 'What is the precise dependency violation eliminated at each normalization stage?',
      mnemonic: {
        hook: 'The Key, the Whole Key, and Nothing But the Key (So Help Me Codd)',
        explanation: '1NF = Atomic attributes; 2NF = Eliminate partial key dependencies; 3NF = Eliminate transitive dependencies; BCNF = Every determinant is a superkey.',
      },
      plainIntuition: 'Normalization means every piece of data lives in exactly one place and is only described by its true primary key.',
      breakdown: [
        '• 1NF: No repeating groups or multivalued attributes; atomic values.',
        '• 2NF: In 1NF + no non-prime attribute is dependent on a proper subset of candidate key.',
        '• 3NF: In 2NF + no non-prime attribute transitively depends on candidate key (X -> A implies X is superkey or A is prime).',
        '• BCNF: For every functional dependency X -> Y, X must be a superkey.',
      ],
      examTrap: 'Not all 3NF relations with functional dependencies are in BCNF. If overlapping candidate keys exist, 3NF may preserve dependencies that BCNF would force into decomposition.',
    },
  ],
};

// ---------------------------------------------------------------------------
// In-Memory Storage Cache & Resolver Service
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Course Materials & Artifact Interfaces
// ---------------------------------------------------------------------------

export interface CourseMaterial {
  id: string;
  courseCode: string;
  courseTitle: string;
  documentTitle: string;
  type: 'PDF' | 'SLIDES' | 'NOTES';
  pages?: number;
  uploadedAt: string;
  tag?: string;
  fileUri?: string;
  fileBase64?: string;
  mimeType?: string;
  textContent?: string;
}

export interface SavedCbtExam {
  courseCode: string;
  courseTitle?: string;
  format: '40(test)' | '60(exam)';
  questions: ExamQuestion[];
  durationSeconds: number;
  createdAt: number;
  userAnswers?: Record<number, any>;
  score?: number;
  isCompleted?: boolean;
}

export interface CoverageAnalysis {
  syllabusCoveragePercent: number;
  coveredTopics: string[];
  gapTopics: string[];
  styleProfile: string;
}

export interface PastQuestionTraining {
  id: string;
  courseCode: string;
  courseTitle?: string;
  targetMode: 'cbt' | 'theory';
  fileName: string;
  fileUri?: string;
  fileBase64?: string;
  mimeType?: string;
  textContent?: string;
  uploadedAt: string;
  coverageAnalysis?: CoverageAnalysis;
}

export interface TutorMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  hint?: string;
  isQuestion?: boolean;
  step?: number;
}

export interface TutorSession {
  courseCode: string;
  messages: TutorMessage[];
  currentStep: number;
  updatedAt: number;
}

export interface EnrolledCourse {
  code: string;
  title: string;
  creditUnits?: number;
  level?: string;
  examDate?: string;
  masteryPercentage?: number;
}

export interface StudentProfile {
  fullName: string;
  university: string;
  facultyOrSchool?: string;
  department: string;
  academicLevel: string;
  targetGpa: string;
  enrolledCourses: EnrolledCourse[];
  hasCompletedOnboarding: boolean;
  avatarInitials?: string;
}

function stringToBase64(str: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(unescape(encodeURIComponent(str)));
    }
  } catch (e) {}

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  const utf8Str = unescape(encodeURIComponent(str));
  for (let i = 0; i < utf8Str.length; i += 3) {
    const enc1 = utf8Str.charCodeAt(i) >> 2;
    const enc2 = ((utf8Str.charCodeAt(i) & 3) << 4) | (utf8Str.charCodeAt(i + 1) >> 4);
    let enc3 = ((utf8Str.charCodeAt(i + 1) & 15) << 2) | (utf8Str.charCodeAt(i + 2) >> 6);
    let enc4 = utf8Str.charCodeAt(i + 2) & 63;
    if (isNaN(utf8Str.charCodeAt(i + 1))) {
      enc3 = enc4 = 64;
    } else if (isNaN(utf8Str.charCodeAt(i + 2))) {
      enc4 = 64;
    }
    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
  }
  return output;
}

const DEFAULT_MATERIALS: CourseMaterial[] = [
  {
    id: 'mat-1',
    courseCode: 'CSC 301',
    courseTitle: 'Operating Systems & Concurrency',
    documentTitle: 'CSC301_Complete_Lecture_Modules_1_to_6.pdf',
    type: 'PDF',
    pages: 48,
    uploadedAt: '2 days ago',
    tag: 'Core Exam Material',
    textContent: `COURSE: CSC 301 Operating Systems and Concurrency Architecture.
Module 1: Concurrency and Race Conditions. Threads vs Processes, mutual exclusion locks, counting semaphores, binary semaphores, monitors, and the Dining Philosophers Problem.
Module 2: Deadlock Avoidance and Bankers Algorithm. Safe vs unsafe states, Coffman conditions (Mutual exclusion, hold and wait, no preemption, circular wait). Safe sequence calculation.
Module 3: Virtual Memory & Page Replacement. Paging, TLB hit/miss latency, Effective Memory Access Time (EMAT), Page replacement algorithms (FIFO, LRU, Optimal), Belady's Anomaly, Thrashing and working-set model.
Module 4: CPU Scheduling Algorithms. FCFS, SJF (Shortest Job First), Round Robin (RR), Priority Scheduling with Aging heuristic. Context switch latencies.
Module 5: File Systems & Disk I/O. Inode structures, directory indexing, disk scheduling (SCAN, C-SCAN, LOOK).`,
  },
  {
    id: 'mat-2',
    courseCode: 'SEN 301',
    courseTitle: 'Software Engineering Architecture',
    documentTitle: 'SEN301_Design_Patterns_&_Clean_Architecture.pdf',
    type: 'SLIDES',
    pages: 36,
    uploadedAt: '3 days ago',
    tag: 'Design & UML',
    textContent: `COURSE: SEN 301 Software Engineering Architecture & Design Patterns.
Module 1: SOLID Principles. Single Responsibility Principle (SRP), Open/Closed Principle (OCP), Liskov Substitution Principle (LSP), Interface Segregation Principle (ISP), Dependency Inversion Principle (DIP).
Module 2: Gang of Four (GoF) Design Patterns. Creational (Factory, Singleton, Builder), Structural (Adapter, Decorator, Facade), Behavioral (Observer, Strategy, Command).
Module 3: Clean Architecture (Robert C. Martin). Concentric layers (Entities, Use Cases, Interface Adapters, Frameworks). The Dependency Rule: Source dependencies point strictly inward.
Module 4: Distributed Systems & Microservices. CAP Theorem (Consistency, Availability, Partition Tolerance), event-driven messaging, saga pattern, eventual consistency.`,
  },
  {
    id: 'mat-3',
    courseCode: 'MTH 301',
    courseTitle: 'Numerical Methods & Algorithms',
    documentTitle: 'MTH301_Newton_Raphson_&_Differential_Eqs.pdf',
    type: 'NOTES',
    pages: 24,
    uploadedAt: '1 week ago',
    tag: 'Formulas & Methods',
    textContent: `COURSE: MTH 301 Numerical Methods and Algorithms.
Module 1: Root Finding. Bisection method, Regula Falsi, Newton-Raphson method (quadratic convergence, x_{n+1} = x_n - f(x_n)/f'(x_n)), Secant method. Convergence proofs and failure conditions.
Module 2: Numerical Linear Algebra. Gaussian elimination with partial pivoting, LU Decomposition, Jacobi and Gauss-Seidel iterative methods. Strictly diagonally dominant matrices.
Module 3: Numerical Integration. Trapezoidal Rule (error O(h^2)), Simpson 1/3 Rule (quadratic interpolation, error O(h^4), requires even subintervals), Simpson 3/8 Rule.
Module 4: Numerical Solution of ODEs. Euler method, Heun's method, 4th-Order Runge-Kutta (RK4) method with local truncation error O(h^5) and global error O(h^4).`,
  },
  {
    id: 'mat-4',
    courseCode: 'CSC 305',
    courseTitle: 'Database Systems & Normalization',
    documentTitle: 'CSC305_Relational_Calculus_&_BODMAS_SQL.pdf',
    type: 'PDF',
    pages: 32,
    uploadedAt: 'Just now',
    tag: 'High Yield',
    textContent: `COURSE: CSC 305 Database Systems & Normalization Theory.
Module 1: Relational Algebra & Calculus. Selection, Projection, Cartesian Product, Set Difference, Natural Join, Theta Join, Tuple Relational Calculus (TRC).
Module 2: Normalization Theory. Functional dependencies, Armstrong's Axioms. 1NF (atomic values, no repeating groups), 2NF (eliminate partial key dependencies), 3NF (eliminate transitive dependencies), BCNF (every determinant must be a superkey). Lossless join decomposition and dependency preservation.
Module 3: Transaction Processing & Concurrency. ACID properties. Serializability, conflict equivalence, precedence graphs. Two-Phase Locking (2PL), Strict 2PL, Deadlock detection.
Module 4: Storage & Indexing. B-Trees, B+ Trees, hashing indices, cost-based query optimization.`,
  },
];

// ---------------------------------------------------------------------------
// In-Memory Storage Cache & State Store
// ---------------------------------------------------------------------------

class CourseStudyStore {
  private materials: CourseMaterial[] = [...DEFAULT_MATERIALS];
  private cbtExams: Map<string, SavedCbtExam> = new Map();
  private theoryPapers: Map<string, TheoryExamPaper> = new Map();
  private cramDecks: Map<string, CramDeck> = new Map();
  private tutorSessions: Map<string, TutorSession> = new Map();
  private pastQuestions: Map<string, PastQuestionTraining> = new Map();
  private studentProfile: StudentProfile | null = null;
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Seed initial theory papers for courses that have full university exams
    this.theoryPapers.set('CSC 301', CSC301_THEORY_PAPER);
    this.theoryPapers.set('SEN 301', SEN301_THEORY_PAPER);
    this.theoryPapers.set('CSC 311', FUTMINNA_SAMPLE_EXAM);

    // Seed initial cram decks
    SAMPLE_CRAM_DECKS.forEach((deck) => {
      this.cramDecks.set(deck.courseCode.toUpperCase().trim(), deck);
    });
    this.cramDecks.set('MTH 301', MTH301_CRAM_DECK);
    this.cramDecks.set('CSC 305', CSC305_CRAM_DECK);

    // No pre-seeded past questions: courses only become trained when authentic past questions are uploaded via the AI Trainer

    // Hydrate student profile from web localStorage if present
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = localStorage.getItem('campus_cram_student_profile');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            this.studentProfile = parsed;
          }
        }
      } catch (e) {
        // ignore web storage errors
      }
    }
  }

  // -------------------------------------------------------------------------
  // Reactivity Subscriptions
  // -------------------------------------------------------------------------
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener();
      } catch (err) {
        console.warn('Error notifying studyStore listener:', err);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Student Academic Profile & Personalized Setup
  // -------------------------------------------------------------------------
  getStudentProfile(): StudentProfile | null {
    return this.studentProfile;
  }

  setStudentProfile(profile: StudentProfile): void {
    const names = (profile.fullName || 'Student').trim().split(/\s+/);
    const initials =
      names.length > 1
        ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
        : (names[0]?.slice(0, 2) || 'CC').toUpperCase();

    this.studentProfile = {
      ...profile,
      hasCompletedOnboarding: true,
      avatarInitials: initials,
    };

    // Auto-populate workspace materials for student's custom enrolled courses
    if (profile.enrolledCourses && profile.enrolledCourses.length > 0) {
      profile.enrolledCourses.forEach((c, idx) => {
        const cleanCode = c.code.toUpperCase().trim();
        const existing = this.materials.find(
          (m) => m.courseCode.toUpperCase().trim() === cleanCode
        );
        if (!existing) {
          this.materials.unshift({
            id: `mat-user-${Date.now()}-${idx}`,
            courseCode: cleanCode,
            courseTitle: c.title,
            documentTitle: `${cleanCode.replace(/\s+/g, '_')}_Syllabus_&_Notes.pdf`,
            type: 'PDF',
            pages: 28,
            uploadedAt: 'Active Syllabus',
            tag: 'Enrolled Course',
            textContent: `COURSE: ${cleanCode} ${c.title}.
University: ${profile.university}.
Department: ${profile.department}.
Academic Level: ${profile.academicLevel}.
Target Academic Goal: ${profile.targetGpa} GPA Track.
Curriculum scope includes core theory, practice problems, past examination formats, and exam preparation objectives for ${c.title}.`,
          });
        }
      });
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem('campus_cram_student_profile', JSON.stringify(this.studentProfile));
      } catch (e) {
        // ignore web storage errors
      }
    }

    this.notifyListeners();
  }

  updateStudentProfile(partial: Partial<StudentProfile>): void {
    if (!this.studentProfile) return;
    this.setStudentProfile({
      ...this.studentProfile,
      ...partial,
    });
  }

  resetStudentProfile(): void {
    this.studentProfile = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.removeItem('campus_cram_student_profile');
      } catch (e) {
        // ignore web storage errors
      }
    }
    this.notifyListeners();
  }

  getEnrolledCourses(): EnrolledCourse[] {
    if (this.studentProfile && this.studentProfile.enrolledCourses && this.studentProfile.enrolledCourses.length > 0) {
      return this.studentProfile.enrolledCourses;
    }
    return [
      { code: 'CSC 301', title: 'Operating Systems & Concurrency', creditUnits: 3, masteryPercentage: 78 },
      { code: 'SEN 301', title: 'Software Engineering Architecture', creditUnits: 3, masteryPercentage: 82 },
      { code: 'MTH 301', title: 'Numerical Methods & Analysis', creditUnits: 3, masteryPercentage: 65 },
      { code: 'CSC 305', title: 'Database Systems & SQL', creditUnits: 3, masteryPercentage: 70 },
    ];
  }

  // -------------------------------------------------------------------------
  // Materials Management
  // -------------------------------------------------------------------------
  getAllMaterials(): CourseMaterial[] {
    return [...this.materials];
  }

  getMaterial(idOrCourseCode?: string): CourseMaterial | null {
    if (!idOrCourseCode) return null;
    const clean = idOrCourseCode.toUpperCase().trim();
    return (
      this.materials.find(
        (m) => m.id === idOrCourseCode || m.courseCode.toUpperCase().trim() === clean
      ) || null
    );
  }

  addOrUpdateMaterial(mat: CourseMaterial): void {
    const existingIndex = this.materials.findIndex(
      (m) =>
        m.id === mat.id ||
        (mat.courseCode && m.courseCode.toUpperCase().trim() === mat.courseCode.toUpperCase().trim())
    );

    if (existingIndex >= 0) {
      this.materials[existingIndex] = {
        ...this.materials[existingIndex],
        ...mat,
      };
    } else {
      this.materials.unshift(mat);
    }
    this.notifyListeners();
  }

  getMaterialDocumentPayload(idOrCourseCode?: string): { base64: string; mimeType: string; fileName: string } | null {
    const mat = this.getMaterial(idOrCourseCode);
    if (!mat) return null;

    if (mat.fileBase64 && mat.fileBase64.length > 0) {
      return {
        base64: mat.fileBase64,
        mimeType: mat.mimeType || 'application/pdf',
        fileName: mat.documentTitle,
      };
    }

    if (mat.textContent && mat.textContent.length > 0) {
      return {
        base64: stringToBase64(mat.textContent),
        mimeType: 'text/plain',
        fileName: mat.documentTitle,
      };
    }

    return null;
  }

  // -------------------------------------------------------------------------
  // CBT Exam Accessors
  // -------------------------------------------------------------------------
  hasCbtExam(courseCode?: string): boolean {
    if (!courseCode) return false;
    const cleanCode = courseCode.toUpperCase().trim();
    const exam = this.cbtExams.get(cleanCode);
    return Boolean(exam && exam.questions && exam.questions.length > 0);
  }

  getCbtExam(courseCode?: string): SavedCbtExam | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.cbtExams.get(cleanCode) || null;
  }

  saveCbtExam(courseCode: string, exam: SavedCbtExam): void {
    const cleanCode = courseCode.toUpperCase().trim();
    this.cbtExams.set(cleanCode, exam);
    this.notifyListeners();
  }

  // Backward-compatibility shim
  getExamForCourse(courseCode?: string): ExamQuestion[] | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    const saved = this.cbtExams.get(cleanCode);
    return saved?.questions || null;
  }

  saveCustomExam(courseCode: string, questions: ExamQuestion[]): void {
    const cleanCode = courseCode.toUpperCase().trim();
    const existing = this.cbtExams.get(cleanCode);
    this.cbtExams.set(cleanCode, {
      courseCode: cleanCode,
      format: questions.length <= 40 ? '40(test)' : '60(exam)',
      questions,
      durationSeconds: questions.length <= 40 ? 30 * 60 : 40 * 60,
      createdAt: Date.now(),
      ...existing,
    });
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Theory Paper Accessors
  // -------------------------------------------------------------------------
  hasTheoryExam(courseCode?: string): boolean {
    if (!courseCode) return false;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.theoryPapers.has(cleanCode);
  }

  getTheoryPaperForCourse(courseCode?: string): TheoryExamPaper | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.theoryPapers.get(cleanCode) || null;
  }

  saveCustomTheoryPaper(courseCode: string, paper: TheoryExamPaper): void {
    const cleanCode = courseCode.toUpperCase().trim();
    this.theoryPapers.set(cleanCode, paper);
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Cram Deck Accessors
  // -------------------------------------------------------------------------
  hasCramDeck(courseCode?: string): boolean {
    if (!courseCode) return false;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.cramDecks.has(cleanCode);
  }

  getCramDeckForCourse(courseCode?: string): CramDeck | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.cramDecks.get(cleanCode) || null;
  }

  getAllCramDecks(): CramDeck[] {
    return Array.from(this.cramDecks.values());
  }

  saveCustomCramDeck(deck: CramDeck): void {
    this.cramDecks.set(deck.courseCode.toUpperCase().trim(), deck);
    this.notifyListeners();
  }

  // -------------------------------------------------------------------------
  // Socratic AI Tutor Accessors & Priming
  // -------------------------------------------------------------------------
  hasTutorSession(courseCode?: string): boolean {
    if (!courseCode) return false;
    const cleanCode = courseCode.toUpperCase().trim();
    const session = this.tutorSessions.get(cleanCode);
    return Boolean(session && session.messages && session.messages.length > 0);
  }

  getTutorSession(courseCode?: string): TutorSession | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.tutorSessions.get(cleanCode) || null;
  }

  saveTutorSession(courseCode: string, messages: TutorMessage[], currentStep: number): void {
    const cleanCode = courseCode.toUpperCase().trim();
    this.tutorSessions.set(cleanCode, {
      courseCode: cleanCode,
      messages,
      currentStep,
      updatedAt: Date.now(),
    });
    this.notifyListeners();
  }

  getTutorContextForCourse(courseCode?: string, courseTitle?: string) {
    const code = (courseCode || 'CSC 301').toUpperCase().trim();
    const title = courseTitle || 'Operating Systems & Concurrency';

    switch (code) {
      case 'SEN 301':
        return {
          greeting: `Hello! I'm your Socratic Tutor for **SEN 301: ${title}**.\n\nRather than giving you plain answers, I will guide you step-by-step through architecture trade-offs and design patterns so you can justify them under exam pressure.\n\nWhich software architecture topic would you like to master today?`,
          topics: [
            'Liskov Substitution & SOLID',
            'Observer vs Pub/Sub Trade-offs',
            'CAP Theorem in Distributed Systems',
            'Clean Architecture Dependencies',
          ],
        };
      case 'MTH 301':
        return {
          greeting: `Hello! I'm your Socratic Tutor for **MTH 301: ${title}**.\n\nLet's master the mathematical mechanics of numerical algorithms and convergence proofs.\n\nWhich numerical method shall we work through?`,
          topics: [
            'Newton-Raphson Quadratic Convergence',
            'Simpson 1/3 Rule Error Bounds',
            'Runge-Kutta 4th Order Mechanics',
            'Gauss-Seidel Iteration Conditions',
          ],
        };
      case 'CSC 305':
        return {
          greeting: `Hello! I'm your Socratic Tutor for **CSC 305: ${title}**.\n\nWe will work through relational theory, functional dependencies, and ACID transaction isolation.\n\nWhich concept would you like to tackle?`,
          topics: [
            'BCNF vs 3NF Decomposition',
            'Two-Phase Locking (2PL) Protocol',
            'ACID vs BASE Eventual Consistency',
            'Lossless Join Dependency Proofs',
          ],
        };
      case 'CSC 301':
      default:
        return {
          greeting: `Hello! I'm your Socratic Tutor for **${code}: ${title}**.\n\nRather than simply giving you answers, I'll guide you step-by-step to master high-yield concepts so you can defend them on exam day.\n\nWhat concept would you like to master today?`,
          topics: [
            'Deadlock Avoidance & Bankers Algo',
            'Process vs Thread Memory Spaces',
            'Page Replacement & Belady Anomaly',
            'Semaphore vs Mutex Ownership',
          ],
        };
    }
  }

  // -------------------------------------------------------------------------
  // Past Questions & AI Format Training Accessors
  // -------------------------------------------------------------------------
  hasPastQuestions(courseCode?: string, mode?: 'cbt' | 'theory'): boolean {
    if (!courseCode) return false;
    const cleanCode = courseCode.toUpperCase().trim();
    if (mode) {
      return this.pastQuestions.has(`${cleanCode}_${mode.toUpperCase()}`);
    }
    return (
      this.pastQuestions.has(`${cleanCode}_CBT`) ||
      this.pastQuestions.has(`${cleanCode}_THEORY`)
    );
  }

  getPastQuestions(courseCode?: string, mode: 'cbt' | 'theory' = 'cbt'): PastQuestionTraining | null {
    if (!courseCode) return null;
    const cleanCode = courseCode.toUpperCase().trim();
    return this.pastQuestions.get(`${cleanCode}_${mode.toUpperCase()}`) || null;
  }

  savePastQuestions(training: PastQuestionTraining): void {
    const cleanCode = training.courseCode.toUpperCase().trim();
    const modeKey = training.targetMode.toUpperCase();
    this.pastQuestions.set(`${cleanCode}_${modeKey}`, training);
    this.notifyListeners();
  }

  deletePastQuestions(courseCode: string, mode: 'cbt' | 'theory'): void {
    const cleanCode = courseCode.toUpperCase().trim();
    this.pastQuestions.delete(`${cleanCode}_${mode.toUpperCase()}`);
    this.notifyListeners();
  }

  getAllPastQuestions(): PastQuestionTraining[] {
    return Array.from(this.pastQuestions.values());
  }

  getPastQuestionsByMode(mode: 'cbt' | 'theory'): PastQuestionTraining[] {
    return Array.from(this.pastQuestions.values()).filter((pq) => pq.targetMode === mode);
  }

  analyzeSyllabusCoverage(
    pastQuestionText: string,
    courseCode: string,
    mode: 'cbt' | 'theory'
  ): CoverageAnalysis {
    const material = this.getMaterial(courseCode);
    const syllabus = material?.textContent || material?.courseTitle || '';

    // Extract syllabus module concepts
    const moduleMatches = syllabus.match(/Module \d+:\s*([^.\n]+)/gi) || [];
    const topicsList = moduleMatches.length > 0
      ? moduleMatches.map((m) => m.replace(/Module \d+:\s*/i, '').trim())
      : [
          'Core Theoretical Foundations',
          'Applied Procedural Analysis',
          'Algorithmic & Mathematical Modeling',
          'System Architecture & Synthesis',
          'Edge Case Diagnostic Traps',
        ];

    const lowerPq = pastQuestionText.toLowerCase();
    const covered: string[] = [];
    const gaps: string[] = [];

    topicsList.forEach((topic) => {
      const words = topic
        .toLowerCase()
        .split(/[\s,&/]+/)
        .filter((w) => w.length > 3);
      const isMentioned = words.some((w) => lowerPq.includes(w));
      if (isMentioned || lowerPq.length < 50) {
        if (covered.length < Math.max(1, Math.floor(topicsList.length * 0.7))) {
          covered.push(topic);
        } else {
          gaps.push(topic);
        }
      } else {
        gaps.push(topic);
      }
    });

    if (gaps.length === 0 && covered.length > 1) {
      gaps.push(covered.pop()!);
    }

    const coveragePercent = Math.min(
      95,
      Math.max(40, Math.round((covered.length / (covered.length + gaps.length)) * 100))
    );

    const style = mode === 'cbt'
      ? 'Procedural scenario questions • Tricky negative distractors • High conceptual precision'
      : 'Rigorous multi-part proofs • Subquestions (a),(b),(c) with strict mark rubrics';

    return {
      syllabusCoveragePercent: coveragePercent,
      coveredTopics: covered,
      gapTopics: gaps,
      styleProfile: style,
    };
  }
}

export const studyStore = new CourseStudyStore();

