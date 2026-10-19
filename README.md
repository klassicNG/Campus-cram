# Campus Cram

**A mobile-first examination preparation and study management platform built for university students.**

[![Official Landing Page & APK](https://img.shields.io/badge/📱_Official_Landing_Page_&_APK-campuscram.vercel.app-000000?style=for-the-badge)](https://campuscram.vercel.app/)
[![Web Preview (Beta)](https://img.shields.io/badge/🌐_Web_Preview_(Beta)-campus--cram.vercel.app-334155?style=for-the-badge)](https://campus-cram.vercel.app/)

> **Platform Note:** Campus Cram is engineered **mobile-first** for Android using React Native and Expo. For the complete, intended user experience and native performance, download the Android APK via the [Official Landing Page](https://campuscram.vercel.app/). The browser-based [Web Companion](https://campus-cram.vercel.app/) is currently maintained as an experimental **beta preview**.

---

## Overview

**Campus Cram** helps university students organize their study schedules, simulate computer-based tests (CBT), and revise efficiently on the go. 

### Product Evolution: From Hackathon MVP (v1) to Mobile-First Production (v2)
Campus Cram is the second-generation architectural evolution of **[SmartCBT](https://github.com/klassicNG/smart-cbt)**—an AI-powered web prototype originally developed in Next.js and Google Gemma AI for the *Build with Gemma: AI for Africa Hackathon*. 

Post-hackathon user testing revealed a clear practical constraint: university students primarily revise on mobile phones during commutes, in hostels, or between lectures, often under unstable network conditions where desktop-oriented web layouts feel restrictive. To solve this, the platform was re-architected from the ground up into **Campus Cram** using **React Native, Expo, and TypeScript**, prioritizing native mobile ergonomics, touch responsiveness, and low-latency performance.

---

## Key Features

- **Timed CBT Exam Simulations:** Realistic practice sessions with deterministic countdown timers, instant question navigation, and automated scoring.
- **Structured Study Management:** Tools to organize course material, track revision progress, and stay consistent ahead of university exams.
- **Mobile-First Ergonomics:** Built with native gesture handling, clean typography, and distraction-free dark/light UI patterns tailored for small screens.
- **Cross-Platform Foundation:** Powered by a unified React Native & Expo codebase with an accompanying web preview.

---

## Tech Stack & Architecture

- **Framework:** [React Native](https://reactnative.dev/) & [Expo](https://expo.dev/)
- **Language:** [TypeScript](https://www.typescriptlang.org/) (strict interfaces for assessment payloads, session state, and navigation)
- **Styling & UI:** React Native StyleSheet / Flexbox primitives optimized for mobile viewports
- **Deployment:** Expo Application Services (EAS) for Android APK distribution & [Vercel](https://vercel.com/) for the landing page and beta web build

### Engineering Highlights
1. **Modular Component Architecture:** Reusable, strictly typed UI primitives that separate visual presentation from assessment state logic.
2. **Predictable State Transitions:** Decoupled exam-timing and scoring calculations from UI rendering cycles to eliminate unnecessary re-renders during active timed sessions.
3. **Pragmatic Iteration:** Transitioned validated concepts from a v1 LLM web prototype ([SmartCBT](https://smart-cbt-ten.vercel.app/)) into a dedicated mobile companion ([Campus Cram](https://campuscram.vercel.app/)).

---

## Getting Started (Local Development)

### Prerequisites
- **Node.js** (v18+ recommended)
- **npm** or **yarn**
- **Expo Go** app installed on your physical Android/iOS device (or an Android Emulator)

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/klassicNG/Campus-cram.git](https://github.com/klassicNG/Campus-cram.git)
   cd Campus-cram

```

2. **Install dependencies:**
```bash
npm install

```


3. **Start the Expo development server:**
```bash
npx expo start

```


4. **Run the application:**
* **Mobile (Recommended):** Scan the QR code in the terminal using the **Expo Go** app on your phone, or press `a` to launch in an Android Emulator.
* **Web (Beta Preview):** Press `w` in the terminal to open the experimental web build in your browser.



---

## Related Links

* **Official APK Download & Showcase:** [https://campuscram.vercel.app/](https://campuscram.vercel.app/)
* **Web Preview (Beta):** [https://campus-cram.vercel.app/](https://campus-cram.vercel.app/)
* **v1 Hackathon Prototype (SmartCBT):** [GitHub Repo](https://github.com/klassicNG/smart-cbt) | [Live Demo](https://smart-cbt-ten.vercel.app/)

---

## Author

**Victor God'spower Nkem** (`klassicNG`)

Full-Stack & Mobile Developer

[GitHub](https://github.com/klassicNG) • [LinkedIn](https://www.linkedin.com/in/victor-god-s-power-08691333b)

```

