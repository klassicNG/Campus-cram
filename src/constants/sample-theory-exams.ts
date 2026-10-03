export interface SubQuestion {
  id: string; // e.g., '1a'
  label: string; // e.g., '(a)'
  prompt: string;
  marks: number;
  rubricKeyPoints: string[];
  modelAnswerSnippet?: string;
}

export interface TheoryQuestion {
  id: number;
  questionNumber: number;
  topic: string;
  totalMarks: number;
  subQuestions: SubQuestion[];
  instructions?: string;
}

export interface TheoryExamPaper {
  id: string;
  institution: string;
  facultyOrSchool: string;
  department: string;
  academicSession: string;
  semester: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  timeAllowedMinutes: number;
  instructions: string;
  isSampleCaseStudy?: boolean;
  questions: TheoryQuestion[];
}

export interface GradingCriterion {
  title: string;
  score: number;
  maxScore: number;
  comment: string;
}

export interface QuestionGradingResult {
  questionId: number;
  subQuestionId?: string;
  marksAwarded: number;
  totalPossibleMarks: number;
  overallFeedback: string;
  criteria: GradingCriterion[];
  strengths: string[];
  omissionsOrDeficiencies: string[];
  modelSolutionComparison: string;
  gradedAt: string;
  capturedImageBase64?: string;
}

// Authentic Federal University of Technology, Minna (FUTMINNA) Case Study Examination
export const FUTMINNA_SAMPLE_EXAM: TheoryExamPaper = {
  id: 'futminna-csc311-2024',
  institution: 'FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA',
  facultyOrSchool: 'School of Information and Communication Technology (SICT)',
  department: 'Department of Computer Science',
  academicSession: '2023/2024 Academic Session',
  semester: 'First Semester Examination',
  courseCode: 'CSC 311',
  courseTitle: 'Design and Analysis of Algorithms',
  creditUnits: 3,
  timeAllowedMinutes: 120, // 2 Hours
  instructions: 'Answer any THREE (3) questions. All questions carry equal marks (20 Marks each). Write clearly and legibly.',
  isSampleCaseStudy: true,
  questions: [
    {
      id: 1,
      questionNumber: 1,
      topic: 'Divide-and-Conquer & Sorting Proofs',
      totalMarks: 20,
      instructions: 'Answer all sub-questions for Question 1.',
      subQuestions: [
        {
          id: '1a',
          label: '(a)',
          prompt: 'With the aid of a clear conceptual diagram, systematically describe the three operational steps of the Divide-and-Conquer paradigm.',
          marks: 6,
          rubricKeyPoints: [
            'Divide: Breakdown of problem into disjoint subproblems of smaller sizes.',
            'Conquer: Recursive solving of subproblems until base cases are met.',
            'Combine: Synthesizing solutions of subproblems into complete solution.',
            'Diagram showing input problem splitting into subproblems and recombining upward.',
          ],
          modelAnswerSnippet:
            'Divide: Split into subproblems. Conquer: Solve recursively or directly at base case. Combine: Merge sub-solutions. Diagram must illustrate recursion tree/split-merge pipeline.',
        },
        {
          id: '1b',
          label: '(b)',
          prompt:
            'Formulate the mathematical recurrence relation for the MergeSort algorithm. Solve this recurrence analytically using the Master Theorem to determine its exact asymptotic time complexity Θ(n log n).',
          marks: 8,
          rubricKeyPoints: [
            'Formulation: T(n) = 2T(n/2) + Θ(n) with T(1) = Θ(1).',
            'Identification of Master Theorem parameters: a = 2, b = 2, f(n) = Θ(n).',
            'Calculation of log_b(a) = log_2(2) = 1.',
            'Application of Case 2: f(n) = Θ(n^{log_b a}) = Θ(n^1), concluding T(n) = Θ(n log n).',
          ],
          modelAnswerSnippet:
            'T(n) = 2T(n/2) + c·n. Here a=2, b=2, log_b(a)=1. Since f(n) = Θ(n^1), by Master Theorem Case 2, T(n) = Θ(n^1 · log n) = Θ(n log n).',
        },
        {
          id: '1c',
          label: '(c)',
          prompt:
            'Differentiate clearly between an in-place sorting algorithm and a stable sorting algorithm. Provide one representative example for each category and justify whether standard QuickSort satisfies both criteria.',
          marks: 6,
          rubricKeyPoints: [
            'In-place definition: Requires O(1) or O(log n) auxiliary memory beyond the input array.',
            'Stable definition: Preserves the relative original order of elements with equal keys.',
            'Examples: In-place (HeapSort/QuickSort), Stable (MergeSort/InsertionSort).',
            'QuickSort evaluation: In-place with O(log n) stack space, but unstable in its standard partitioning scheme due to distant swaps.',
          ],
          modelAnswerSnippet:
            'In-place uses O(1) extra space. Stable preserves identical key order. QuickSort is in-place but unstable due to partitioning swaps across the pivot.',
        },
      ],
    },
    {
      id: 2,
      questionNumber: 2,
      topic: 'Graph Theory & Shortest Paths',
      totalMarks: 20,
      instructions: 'Answer all sub-questions for Question 2.',
      subQuestions: [
        {
          id: '2a',
          label: '(a)',
          prompt:
            "Explain the algorithmic mechanism of Dijkstra's Single-Source Shortest Path algorithm. Rigorously justify with a concrete counter-example graph why Dijkstra's greedy invariant fails when edges with negative weights are present.",
          marks: 8,
          rubricKeyPoints: [
            'Dijkstra mechanism: Priority queue/min-heap greedy relaxation of edges from unvisited vertices.',
            'Greedy assumption: Once a vertex is marked visited/extracted, its shortest distance is permanently finalized.',
            'Negative edge failure explanation: A subsequent negative edge can provide a shorter path to an already finalized vertex.',
            'Counter-example graph: 3-vertex triangle (e.g. S->A: 3, S->B: 5, B->A: -4) showing Dijkstra incorrectly declaring dist[A]=3.',
          ],
          modelAnswerSnippet:
            'Dijkstra greedily finalizes closest vertex assuming paths only grow monotonically. Negative edges violate this subpath monotonic growth property.',
        },
        {
          id: '2b',
          label: '(b)',
          prompt:
            "Describe Kruskal's algorithm for finding the Minimum Spanning Tree (MST) of a weighted undirected graph. Explain how the Disjoint Set Union (DSU / Union-Find) data structure ensures cycle detection in near-linear time.",
          marks: 7,
          rubricKeyPoints: [
            'Kruskal overview: Sort all edges by ascending weight, greedily select edge if it does not form a cycle.',
            'DSU operations: Find-Set(u) and Find-Set(v) check if endpoints belong to same connected component.',
            'Cycle avoidance: If Find(u) == Find(v), edge is discarded; otherwise Union(u, v) is invoked.',
            'Time complexity: O(E log E) for sorting, plus nearly O(E α(V)) for DSU operations with path compression and union by rank.',
          ],
          modelAnswerSnippet:
            'Sort edges ascending. For each (u, v, w), if Find(u) != Find(v), add edge and Union(u, v). DSU with path compression yields amortized α(V) per check.',
        },
        {
          id: '2c',
          label: '(c)',
          prompt:
            "State the time complexity of the Bellman-Ford algorithm and outline the algorithmic condition used to detect negative-weight cycles reachable from the source vertex.",
          marks: 5,
          rubricKeyPoints: [
            'Complexity: O(V · E) time, O(V) space.',
            'Relaxation rounds: Relax all E edges exactly |V| - 1 times.',
            'Negative cycle detection: Run a |V|-th relaxation pass; if any edge (u, v) satisfies dist[u] + weight(u, v) < dist[v], a negative cycle exists.',
          ],
          modelAnswerSnippet:
            'Bellman-Ford operates in O(VE). After V-1 iterations, if any edge (u, v) can still be relaxed (dist[u] + w < dist[v]), a reachable negative cycle is detected.',
        },
      ],
    },
    {
      id: 3,
      questionNumber: 3,
      topic: 'Dynamic Programming & Optimization',
      totalMarks: 20,
      instructions: 'Answer all sub-questions for Question 3.',
      subQuestions: [
        {
          id: '3a',
          label: '(a)',
          prompt:
            'Formulate the principle of Optimal Substructure and Overlapping Subproblems as fundamental prerequisites for Dynamic Programming. How does DP differ fundamentally from the Divide-and-Conquer strategy?',
          marks: 6,
          rubricKeyPoints: [
            'Optimal Substructure: Optimal solution to problem contains within it optimal solutions to subproblems.',
            'Overlapping Subproblems: Same subproblems are repeatedly encountered during recursive decomposition.',
            'Contrast with Divide-and-Conquer: D&C solves independent/non-overlapping subproblems (e.g. MergeSort), while DP avoids re-computation via memoization or tabulation.',
          ],
        },
        {
          id: '3b',
          label: '(b)',
          prompt:
            'State the formal mathematical recurrence for the 0/1 Knapsack Problem for n items with values v_i and weights w_i and capacity W. Show the state definition K(i, w) and write pseudocode for the bottom-up DP table construction.',
          marks: 8,
          rubricKeyPoints: [
            'State definition: K(i, w) represents maximum value achievable using a subset of first i items within weight budget w.',
            'Recurrence: If w_i > w, K(i, w) = K(i-1, w). Else K(i, w) = max(K(i-1, w), v_i + K(i-1, w - w_i)).',
            'Base cases: K(0, w) = 0 and K(i, 0) = 0.',
            'Complexity: O(n·W) pseudo-polynomial time and space.',
          ],
        },
        {
          id: '3c',
          label: '(c)',
          prompt:
            'Compare the 0/1 Knapsack Problem with the Fractional Knapsack Problem. Prove why the Greedy approach is provably optimal for the Fractional variant but fails for the 0/1 variant.',
          marks: 6,
          rubricKeyPoints: [
            'Fractional Knapsack allows taking fractions of items; 0/1 requires discrete binary decision (take whole or leave).',
            'Greedy choice property: Sorting by value-to-weight ratio (v_i / w_i) is provably optimal for fractional via exchange argument.',
            'Counter-example for 0/1: Knapsack capacity 50, item 1 (v=60, w=10, ratio=6), item 2 (v=100, w=20, ratio=5), item 3 (v=120, w=30, ratio=4). Greedy takes item 1 and 2 (v=160), but optimal takes item 2 and 3 (v=220).',
          ],
        },
      ],
    },
    {
      id: 4,
      questionNumber: 4,
      topic: 'Computational Complexity & NP-Completeness',
      totalMarks: 20,
      instructions: 'Answer all sub-questions for Question 4.',
      subQuestions: [
        {
          id: '4a',
          label: '(a)',
          prompt:
            'Precisely define the complexity classes P, NP, NP-Hard, and NP-Complete in terms of deterministic and non-deterministic polynomial time verification.',
          marks: 7,
          rubricKeyPoints: [
            'P: Decision problems solvable in polynomial time O(n^k) on a deterministic Turing machine.',
            'NP: Decision problems verifiable in polynomial time given a certificate/witness.',
            'NP-Hard: Problems to which every problem in NP can be polynomial-time reduced (at least as hard as the hardest problem in NP).',
            'NP-Complete: Problems that belong to both NP and NP-Hard.',
          ],
        },
        {
          id: '4b',
          label: '(b)',
          prompt:
            "Explain the steps required to prove that a newly proposed computational problem 'X' is NP-Complete, referencing Cook-Levin's Theorem.",
          marks: 7,
          rubricKeyPoints: [
            'Step 1: Prove X ∈ NP by providing a polynomial-time verifier and certificate.',
            'Step 2: Select a known NP-Complete problem Y (e.g. 3-SAT, SAT via Cook-Levin, Vertex Cover).',
            'Step 3: Construct a reduction function f that transforms any instance of Y into an instance of X in polynomial time.',
            'Step 4: Prove correctness: instance of Y is a YES-instance if and only if f(Y) is a YES-instance of X.',
          ],
        },
        {
          id: '4c',
          label: '(c)',
          prompt:
            'State whether the Traveling Salesperson Problem (TSP) Optimization version is in NP. Differentiate between the TSP Decision problem and Optimization problem.',
          marks: 6,
          rubricKeyPoints: [
            'TSP Decision: "Does there exist a Hamiltonian tour of cost ≤ k?" — in NP because a candidate tour can be verified in O(n) time.',
            'TSP Optimization: "Find the tour of minimum total cost" — in NP-Hard, but strictly speaking not in NP because verifying optimality requires proving no smaller tour exists.',
          ],
        },
      ],
    },
  ],
};
