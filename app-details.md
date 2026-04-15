# LU3 Stake — Young Men's Camp: App Breakdown

## 🎯 Purpose
A full-featured digital camp management app for the **Lehi Utah 3rd Stake Young Men's Camp**. It helps leaders plan, communicate, and manage all aspects of a youth camp — from scheduling to competitions to registrations.

---

## 🗂️ Pages (12 Total)

| Page | Route | Description |
|---|---|---|
| **Dashboard** | `/` | Home screen — shows today's date, a scripture/inspirational quote, quick stats (units, activities, today's events), today's agenda preview, and upcoming activities. |
| **Activities** | `/activities` | Full list of camp activities. Toggle between **Weekly Timeline** view and **Grid** view. Supports creating/deleting activities with category, date, time, and location. |
| **Daily Agenda** | `/agenda` | Day-by-day schedule. Admins can add agenda items with time slots and locations for each day of camp. |
| **Unit Rosters** | `/units` | View all camp units (wards/groups) and their assigned campers. Stake leaders can create units; unit leaders can add campers. |
| **Competitions** | `/competitions` | Create competitions, track rules, award points per unit, and view a live **leaderboard**. Only staff can award points. |
| **Photo Gallery** | `/photos` | Upload and browse camp photos. |
| **Contacts** | `/contacts` | Directory of camp contacts and emergency contacts. |
| **Camp Rules** | `/rules` | Displays the official camp rules document. |
| **Registration** | `/register` | Parents can register children for camp (name, age, t-shirt size, unit, medical notes). Admins can approve, waitlist, or delete registrations. |
| **Daily Inspiration** | `/inspiration` | Daily scripture or spiritual messages for each day of camp. |
| **Stake Leaders** | `/stake-leaders` | Directory of stake leadership. |
| **Documentation** | `/documentation` | Internal documentation for leaders. |

---

## 🗄️ Entities (Database)

| Entity | Purpose |
|---|---|
| **Activity** | Camp events — title, description, date, time, location, category |
| **DailyAgenda** | Day-by-day schedule with time-slot items |
| **DailyMessage** | Daily inspiration/scripture by date |
| **Unit** | Camp unit (ward group) — name, color, leader info |
| **Camper** | Individual camper — name, age, unit assignment |
| **Competition** | Competition events — name, rules, date, status |
| **CompetitionPoints** | Points awarded to a unit for a competition |
| **Registration** | Camper sign-up form data — parent info, child info, status |
| **StakeLeader** | Stake leadership directory with emails (used for permissions) |
| **Contact** | Camp contacts and emergency contacts |

---

## 🔐 Permissions System

| Role | How Determined | Abilities |
|---|---|---|
| **Stake Leader** | Email matches a `StakeLeader` record | Full edit — create units, delete anything, manage all data |
| **Unit Leader** | Email matches a `Unit.leader_email` | Can add campers to units, edit within their scope |
| **Camper** | Email matches a `Camper` record | **View only** — no create/edit/delete |
| **Staff** (Competitions) | Email matches a non-emergency `Contact` | Can award competition points |
| **Everyone else** | Not matched | Can edit most things (canEdit = true unless they're a camper) |

---

## 🧱 Component Architecture

- **`AppLayout`** — wraps all pages with a sidebar + main content area
- **`Sidebar`** — navigation menu with all 12 page links
- **`PageHeader`** — reusable header component (title, subtitle, icon, optional action button)
- **`EmptyState`** — reusable empty list placeholder
- **`WeeklyTimeline`** — activities grouped by day of week (used in Activities page)

---

## 🎨 Design System

- **Color palette**: Token-based via `index.css` CSS variables (primary, accent, muted, chart colors)
- **Typography**: Custom `font-heading` for titles, clean sans-serif body
- **Layout**: Sidebar left (64px wide on desktop), mobile-responsive with top nav
- **Cards**: Borderless (`border-0`) with subtle `shadow-sm`, hover effects
- **Badges**: Used for status indicators (pending/approved/waitlisted, competition status, activity categories)

---

## ⚙️ Tech Stack

- **React** + **Vite** + **TypeScript-friendly JSX**
- **Tailwind CSS** for styling
- **shadcn/ui** for all UI components
- **TanStack Query** for all data fetching and mutations
- **Base44 SDK** (`base44.entities.*`) for the entire backend
- **date-fns** for date formatting
- **lucide-react** for icons

---

## 🔑 Key Flows

1. **Parent registers a child** → fills out form on `/register` → admin approves/waitlists
2. **Admin schedules activities** → adds to `/activities` → shows on Dashboard and Weekly Timeline
3. **Leader creates daily agenda** → adds time-slot items on `/agenda` → shows on Dashboard today
4. **Staff awards competition points** → goes to `/competitions` → leaderboard updates live
5. **Stake leader manages units** → creates units on `/units` → assigns campers
