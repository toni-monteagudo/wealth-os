# 💎 Wealth OS

![Wealth OS Dashboard Overview](.gemini/antigravity/brain/7d42408f-01ab-4742-b167-d7ec8f084f12/dashboard_initial_load_1772386902169.png)

Wealth OS is a **Premium Next.js Mission Control** application designed to seamlessly unify personal personal finances, active real estate operations, SaaS businesses, and critical documents into one unified, clean architecture.

Built with a stunning **Premium Light Mode** aesthetic (inspired by modern bento grids), it features Ghost Money tracking, dynamic NLP ingestion for raw bank statements, and deep property tracking natively supported by a MongoDB backend.

---

## 🚀 Core Features

- **Master Dashboard**: Aggregate Net Worth, global LTV ratios, and Monthly Free Cash Flow with a snapshot of active operations.
- **Active Assets Deep-Dive**: Drill into Real Estate properties to track mortgages, tenants, and construction projects or dig into SaaS MRR analytics.
- **AI Ingestion Hub**: Upload raw `.csv` or `.xlsx` statements. The app auto-categorizes flows and prompts for visual review before locking transactions into the ledger.
- **Ghost Money Reserves**: Automatically route percentages of income to locked buckets (Tax Vaults, Maintenance, Emergency Funds).
- **Project Workspaces**: Track detailed renovation budgets, actual vs. budgeted expenses, and important chronological notes.
- **Document Vault**: Store critical PDFs (deeds, insurance, incorporation documents) with active expiration tracking.
- **Internationalization (i18n)**: Fully translated into Spanish (`es`) and English (`en`) via custom Context hooks.

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Language**: TypeScript throughout both frontend & route handlers
- **Styling**: Tailwind CSS v4 (Custom Premium Light tokens)
- **Database**: MongoDB 7 (Mongoose ORM)
- **Icons**: Lucide React
- **Charts**: Recharts

---

## 📦 Getting Started

### Prerequisites

Ensure you have **Node.js** (v18+) and **Docker** installed on your system.

### 1. Database Setup

Spin up the local MongoDB 7 cluster using the included `docker-compose.yml`:

```bash
docker-compose up -d mongo
```
> *Note: By default, the app looks for `mongodb://localhost:27017/wealthos`. If your Docker setup maps correctly, no `.env` configuration is strictly required for local development.*

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> 🪄 **Auto-Seeding Magic**: The first time the application loads and queries `/api/kpis`, it detects that the database is empty and automatically hydrates the database with the highly detailed baseline test data (like the Barcelona Loft and SaaS structures).

---

## 📐 Design Philosophy

Wealth OS intentionally ignores standard "dark mode hacker" aesthetics in favor of a bright, high-contrast, high-padding structure. Information hierarchy is enforced through typography tracking, subtle teal/emerald accents (`bg-emerald-50 text-emerald-600`), and clean rounded cards (`rounded-3xl` for masters, `rounded-xl` for items) to make financial management feel like controlling a premium vehicle rather than looking at a spreadsheet.

---

## 🔒 License

MIT License - feel free to build upon this OS to manage your own empire.
