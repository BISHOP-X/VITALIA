# 🏥 Vitalia - AI-Integrated Digital Health System

> A modern, AI-powered healthcare platform designed as a Final Year Project demonstrating how Artificial Intelligence can transform healthcare from "passive record keeping" to "active clinical partnership."

![Vitalia Health Platform](src/assets/health-pattern.jpg)

---

## 🎓 Important Note: About This Demo System

This application is a **High-Fidelity Proof of Concept** built for academic demonstration purposes. Before exploring, please understand our intentional design approach:

### Why You'll See Pre-Populated Data

When you open Vitalia, you'll notice the system already contains patient records, medical histories, chat conversations, and health data. **This is by design, not a limitation.**

Here's why this approach is actually **superior for demonstration**:

| Real-World Challenge | Our Solution |
|---------------------|--------------|
| 🕐 **A brand new health app would be empty** - Real patient data accumulates over months/years of clinical use | We pre-populate realistic scenarios so evaluators can immediately see the system "in action" |
| 📊 **Trend charts need history** - BMI trends, vital patterns, and AI insights require historical data points | Mock data provides meaningful visualizations from day one |
| 💬 **Conversations take time** - Doctor-patient chat history builds up gradually in real usage | Pre-written conversations demonstrate the full communication workflow |
| 💰 **AI calls cost money** - Each real AI analysis costs cloud resources | Strategic mock responses allow unlimited demonstrations without API costs |

### What IS Real (Technical Integrations)

To prove technical competency, these features connect to **actual cloud services**:

- ✅ **User Authentication** - Real Supabase Auth (sign up, sign in, password reset)
- ✅ **Database Operations** - Real PostgreSQL writes (symptom logging, profile creation)
- ✅ **AI Integration** - Live API calls to demonstrate LLM capabilities

### The Best of Both Worlds

This hybrid approach means you get:
1. **A polished, impressive demo** - Every screen looks like a system with years of usage
2. **Proven technical skills** - Core integrations work with real cloud infrastructure
3. **Reliable presentations** - No "sorry, the API is down" moments during your demo

> 💡 **For Evaluators:** Think of the mock data as "sample content" - like how a phone in a store displays demo photos. It shows exactly how the real system would look and feel with actual clinical usage.

---

## 📋 Table of Contents

1. [What is Vitalia?](#what-is-vitalia)
2. [Features Overview](#features-overview)
3. [How to Run the Project](#how-to-run-the-project)
4. [Navigating the Application](#navigating-the-application)
5. [Page-by-Page Guide](#page-by-page-guide)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [For Developers](#for-developers)
9. [Troubleshooting](#troubleshooting)

---

## 🤔 What is Vitalia?

Vitalia is a **dual-interface Digital Health Record platform** that serves two types of users:

1. **Patients** - Track your health, log symptoms, chat with doctors, and get AI-powered health insights
2. **Doctors** - Review patient records, use AI tools for clinical notes, and communicate with patients

The platform uses a modern glass-morphism design (frosted glass look) and is fully responsive on mobile and desktop devices.

---

## ✨ Features Overview

### For Patients (Mobile-Friendly)
| Feature | Description |
|---------|-------------|
| 🫀 **Health Dashboard** | See your health score (87%), heart rate, blood pressure, sleep, and BMI at a glance |
| 🤖 **AI Health Advisor** | Get AI-powered health insights based on your symptoms and vitals |
| 📝 **Log Symptoms** | Record how you're feeling with symptom type, severity, duration, and body location |
| 📅 **Book Appointments** | Schedule visits with your doctor |
| 💬 **Chat with Doctor** | Real-time messaging with your healthcare provider |
| ⚖️ **BMI Calculator** | Track your body mass index with visual gauge and history chart |
| 💊 **Medication Reminders** | Keep track of your medication schedule |
| 📊 **Medical History** | View past consultations and records |

### For Doctors (Desktop-Optimized)
| Feature | Description |
|---------|-------------|
| 👥 **Patient Registry** | View all patients with color-coded risk badges (Low/Medium/High) |
| 🔍 **Smart Patient Profile** | Detailed view of patient's vitals, symptoms, history, and medications |
| 🧠 **AI Smart Rundown** | AI-generated 3-point summary of patient's current status |
| 📋 **AI Clinical Notes** | Auto-extract symptoms, diagnosis, and treatment from unstructured notes |
| ⚠️ **AI Risk Analysis** | Automated risk scoring based on patient vitals |
| 💬 **Patient Messaging** | Two-panel chat interface to communicate with all patients |
| 📊 **BMI Tracking** | View patient BMI with trend indicators |

### Account Features
| Feature | Description |
|---------|-------------|
| 🔐 **Sign In/Sign Up** | Create account as Patient or Doctor with email/password |
| 🔑 **Forgot Password** | Reset your password via email link |
| 👤 **Profile Setup** | Add name, age, and gender during registration |

---

## 🚀 How to Run the Project

### Step 1: Prerequisites
Make sure you have these installed on your computer:
- **Node.js** (version 16 or higher) - [Download here](https://nodejs.org/)
- **Git** (optional, for cloning) - [Download here](https://git-scm.com/)

**How to check if Node.js is installed:**
1. Open Command Prompt (Windows) or Terminal (Mac)
2. Type `node --version` and press Enter
3. You should see something like `v18.17.0`

### Step 2: Get the Project Files
If you received a ZIP file:
1. Extract the ZIP to a folder (e.g., `Desktop/BOLU PROJECT`)

If cloning from Git:
```bash
git clone <repository-url>
cd "BOLU PROJECT"
```

### Step 3: Install Dependencies
1. Open Command Prompt or Terminal
2. Navigate to the project folder:
   ```bash
   cd "C:\Users\YourName\Desktop\BOLU PROJECT"
   ```
3. Install all required packages:
   ```bash
   npm install
   ```
   This may take 2-5 minutes. Wait until it completes.

### Step 4: Start the Application
Run this command:
```bash
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:8080/
  ➜  Network: http://192.168.x.x:8080/
```

### Step 5: Open in Browser
1. Open your web browser (Chrome, Firefox, Edge, etc.)
2. Go to: **http://localhost:8080**
3. You should see the Vitalia landing page!

### To Stop the Server
Press `Ctrl + C` in the terminal where the server is running.

---

## 🧭 Navigating the Application

### Landing Page (Home)
When you open the app, you'll see the **Welcome Page** with:
- Vitalia branding and tagline
- **"Get Started"** button - Click this to open the login/signup modal
- Feature highlights (AI Insights, Doctor Connections, Health Dashboard)

### Logging In / Signing Up
1. Click **"Get Started"**
2. **Choose your role**: Click "Patient" or "Doctor" tab
3. **Sign In**: Enter email and password, click "Sign In"
4. **Sign Up**: Click "Sign up" link, fill in your details (name, age, gender)
5. **Forgot Password**: Click "Forgot Password?" to reset via email

### Quick Navigation
- **Patient Dashboard**: `http://localhost:8080/patient`
- **Doctor Dashboard**: `http://localhost:8080/doctor`
- **Home Page**: `http://localhost:8080/`

---

## 📱 Page-by-Page Guide

### 1. Landing Page (`/`)
The entry point of the application.

**What you'll see:**
- Background health pattern image
- Glass-morphism welcome card
- "Get Started" button
- Three feature cards (AI Insights, Doctor Connections, Health Dashboard)

**Actions:**
- Click "Get Started" → Opens login modal
- Choose Patient/Doctor role → Navigates to respective dashboard

---

### 2. Patient Dashboard (`/patient`)
Your personal health command center.

**Top Section:**
- Greeting with your name ("Good morning, Sarah")
- Notification bell (click to see alerts)
- Settings gear icon

**Health Ring:**
- Large circular display showing 87% health score
- Color indicates status (green = good)

**Quick Stats Bar (4 cards):**
| Stat | Value | Note |
|------|-------|------|
| Heart Rate | 72 bpm | Normal |
| Blood Pressure | 120/80 mmHg | Normal |
| Sleep | 7.5 hrs | Good |
| **BMI** | 24.1 Normal | **Click to open BMI Calculator** |

**Action Cards (5 cards):**
1. **AI Health Advisor** (Purple) - Get AI health insights
2. **Log Symptoms** - Record how you're feeling
3. **My History** - View past medical records
4. **Book Visit** - Schedule an appointment
5. **Reminders** - Medication reminders

**Upcoming Visit Card:**
- Shows next appointment (Dr. Martinez, Jan 28, 2026)

**Bottom Navigation:**
- Home | Activity | Schedule | Exit

**Floating Chat Button (bottom-right):**
- Teal circular button with message icon
- Click to chat with your doctor
- Shows red badge if unread messages

---

### 3. Doctor Dashboard (`/doctor`)
Clinical workspace for healthcare providers.

**Header:**
- Vitalia Clinic branding
- Search bar to find patients
- Chat icon (shows unread count)
- Notification bell
- Settings gear
- Logout button

**Patient Registry (main view):**
- Grid of patient cards
- Each card shows: Photo, Name, Age, Risk Level, Last Visit
- **Risk Badges:**
  - 🟢 Green = Low Risk
  - 🟡 Yellow = Medium Risk
  - 🔴 Red = High Risk
- Click any patient to view their full profile

**Patient Detail View (after clicking a patient):**

*Left Panel:*
- Patient photo and name
- Back button to return to registry
- Latest Vitals (BP, HR, Temp, O2, Weight, BMI with trend arrows)
- Medical History (allergies, chronic conditions, surgeries, medications)
- Recent Symptoms (with severity bars)
- Past Consultations

*Right Panel - AI Workspace:*
- **Smart Rundown** - AI-generated patient summary
- **Risk Analysis** - AI-powered risk assessment
- **Clinical Notes** - AI-assisted documentation

**Chat Sidebar (click chat icon):**
- Left: List of patient conversations
- Right: Active chat window
- Search patients
- Send/receive messages
- View patient profile from chat

---

### 4. BMI Calculator Modal
Access: Click the BMI stat card on Patient Dashboard

**Input Screen:**
- Height input with cm/inches toggle
- Weight input with kg/lbs toggle
- "Calculate BMI" button

**Results Screen:**
- Large BMI number (e.g., 24.1)
- Visual gauge bar (color-coded: Blue/Green/Yellow/Red)
- Category label (Underweight/Normal/Overweight/Obese)
- Description text
- BMI history trend chart (line graph)
- "Recalculate" and "Save Record" buttons

---

### 5. AI Health Advisor Modal
Access: Click "AI Health Advisor" action card

**Phase 1 - Introduction:**
- Benefits of AI analysis
- Medical disclaimer
- "Analyze My Health" button

**Phase 2 - Loading:**
- 3-second analysis animation
- Progress steps display

**Phase 3 - Results:**
- Urgency level banner (Low/Medium/High)
- Possible conditions with confidence percentages
- Personalized recommendations
- "When to see a doctor" guidance
- "Re-analyze" and "Book Appointment" buttons

---

### 6. Chat System

**Patient Side:**
- Floating teal button (bottom-right)
- Click to open chat panel
- Panel slides up from bottom (mobile) or side (desktop)
- Message bubbles: Your messages (teal, right) | Doctor's messages (gray, left)
- Typing indicator when doctor is responding
- Send messages with Enter key or Send button

**Doctor Side:**
- Chat icon in header with unread badge
- Click to open two-panel sidebar
- Left panel: List of all patient conversations
- Right panel: Active chat with selected patient
- "View Profile" link to jump to patient details

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Frontend Framework | React 18.3.1 |
| Build Tool | Vite 5.4.19 |
| Language | TypeScript 5.8.3 |
| Styling | Tailwind CSS 3.4.17 |
| UI Components | Radix UI (shadcn-ui) |
| Animations | Framer Motion 12.26.2 |
| Icons | Lucide React |
| Routing | React Router DOM 6.30.1 |
| Forms | React Hook Form + Zod |
| State Management | TanStack Query |
| Charts | Recharts 2.15.4 |

---

## 📁 Project Structure

```
BOLU PROJECT/
├── 📄 README.md              # This file - project documentation
├── 📄 CONTEXT.md             # Technical context for developers
├── 📄 package.json           # Project dependencies
├── 📄 .env.example           # Environment variables template
├── 📄 vite.config.ts         # Vite build configuration
├── 📄 tailwind.config.ts     # Tailwind CSS configuration
├── 📄 index.html             # HTML entry point
│
├── 📁 supabase/              # Backend configuration
│   ├── 📄 config.toml        # Supabase local dev settings
│   ├──  migrations/        # Database schema files
│   │   └── 00001_initial_schema.sql
│   └── 📁 functions/         # AI Edge Functions
│       ├── smart-rundown/    # Patient summary AI
│       ├── extract-clinical-data/  # Clinical notes AI
│       └── analyze-risk/     # Risk assessment AI
│
└── 📁 src/                   # Source code
    ├── 📄 App.tsx            # Main application component (routes)
    ├── 📄 main.tsx           # Application entry point
    ├── 📄 index.css          # Global styles
    │
    ├── 📁 pages/             # Main page components
    │   ├── Landing.tsx       # Home/welcome page
    │   ├── PatientDashboard.tsx  # Patient portal
    │   ├── DoctorDashboard.tsx   # Doctor workspace
    │   └── NotFound.tsx      # 404 error page
    │
    ├── 📁 components/        # Reusable UI components
    │   ├── AuthModal.tsx     # Login/signup/forgot password
    │   ├── GlassModal.tsx    # Glass-effect modal wrapper
    │   ├── HealthRing.tsx    # Circular health score display
    │   ├── ActionCard.tsx    # Clickable action cards
    │   ├── PatientCard.tsx   # Patient preview cards
    │   ├── AIWorkspace.tsx   # Doctor AI tools panel
    │   ├── ChatButton.tsx    # Floating chat button
    │   ├── ChatPanel.tsx     # Patient chat interface
    │   ├── DoctorChatSidebar.tsx  # Doctor chat sidebar
    │   ├── ConversationList.tsx   # Chat conversation list
    │   ├── MessageBubble.tsx # Chat message bubble
    │   ├── TypingIndicator.tsx    # Chat typing animation
    │   └── 📁 ui/            # Base UI components (shadcn)
    │
    ├── 📁 hooks/             # Custom React hooks
    │   ├── use-toast.ts      # Toast notification hook
    │   └── useAuth.ts        # Authentication state hook
    │
    ├── 📁 lib/               # Utility functions
    │   ├── utils.ts          # Helper functions
    │   ├── supabase.ts       # Supabase client & auth helpers
    │   └── database.types.ts # TypeScript database types
    │
    └── 📁 assets/            # Images and static files
        ├── health-pattern.jpg
        ├── avatar-1.jpg through avatar-4.jpg
        └── ...
```

---

## 🔧 Backend Setup (Optional)

The application works out-of-the-box in **demo mode** with no backend configuration needed. However, if you want to enable real features:

### Quick Setup (15 minutes)

1. **Create a Supabase account** at [supabase.com](https://supabase.com)
2. **Create a new project** and run the migration in `supabase/migrations/00001_initial_schema.sql`
3. **Copy your credentials** to `.env.local`:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
   ```
4. **(Optional)** For AI features, add your Groq API key as an Edge Function secret named `GROQ_API_KEY`

### What Gets Enabled

| Feature | Demo Mode | With Supabase |
|---------|-----------|---------------|
| Sign In/Sign Up | Simulated | ✅ Real accounts |
| Password Reset | Simulated | ✅ Real emails |
| Symptom Logging | UI only | ✅ Saved to database |
| BMI Records | UI only | ✅ Saved to database |
| AI Analysis | Pre-written | ✅ Real LLM calls* |

*Requires free Groq API key — get one at [console.groq.com](https://console.groq.com)

---

## 👩‍💻 For Developers

### Available Commands

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run code linter
npm run lint

# Run tests
npm run test
```

### Key Files to Know

| File | Purpose |
|------|---------|
| `src/App.tsx` | Defines all routes (/, /patient, /doctor) |
| `src/pages/PatientDashboard.tsx` | Largest file - contains all patient features |
| `src/pages/DoctorDashboard.tsx` | Doctor interface with AI workspace |
| `src/components/AuthModal.tsx` | Authentication flows |
| `CONTEXT.md` | Technical requirements for backend integration |

### Design System

- **Colors**: Teal (primary), Purple (AI features), Amber (BMI), Coral (alerts)
- **Fonts**: Sora (headings), system fonts
- **Style**: Glass-morphism (`backdrop-blur-xl bg-white/10`)
- **Breakpoints**: Mobile-first (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

---

## ❓ Troubleshooting

### "npm: command not found"
Node.js is not installed. Download from [nodejs.org](https://nodejs.org/).

### "ENOENT: no such file or directory"
You're in the wrong folder. Use `cd` to navigate to the project folder.

### Port 8080 already in use
Another app is using port 8080. Either:
- Close the other app
- Or edit `vite.config.ts` and change the port number

### Page not loading / blank screen
1. Check the terminal for error messages
2. Make sure `npm install` completed successfully
3. Try running `npm run build` to see build errors

### Styles look broken
Clear your browser cache (Ctrl+Shift+R) or try a different browser.

---

## 📞 Support

For questions or issues:
1. Check this README first
2. Look at error messages in the terminal
3. Contact the development team

---

## 📄 License

This project is a Final Year Project for educational purposes.

---

**Built with ❤️ using React, TypeScript, and AI**

