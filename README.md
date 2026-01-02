# Training Calendar

A production-ready web app for tracking hypertrophy training, swimming, and 100km trail ultra preparation.

## Features

- **Training Calendar**: Weekly and monthly views with session planning and logging
- **Plan Generator**: Automatic progressive plan generation from start date to race date with periodization
- **Session Logging**: Track RPE, duration, distance, pain scores, and notes
- **Dashboard**: Progress tracking with charts for running distance, adherence, and pain
- **Nutrition**: Calorie and macro calculator based on Mifflin-St Jeor equation
- **Settings**: Customize training frequency, body metrics, and preferences

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **TailwindCSS** + **shadcn/ui**
- **Prisma** + **SQLite**
- **Recharts** for data visualization

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Database

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
```

Then initialize the database:

```bash
npm run db:push
```

### 3. Seed the Database

Generate the training plan from January 2, 2026 to July 20, 2026:

```bash
npm run db:seed
```

This will:
- Create user settings with your profile (183 cm, 89 kg, goal 80 kg)
- Generate a complete training plan with periodization
- Mark January 2, 2026 Upper Body A as completed

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── api/              # API routes
│   ├── calendar/         # Calendar page
│   ├── dashboard/       # Dashboard page
│   ├── nutrition/       # Nutrition page
│   └── settings/        # Settings page
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── navigation.tsx   # Navigation bar
│   ├── session-card.tsx # Session card component
│   ├── session-editor.tsx # Session editor modal
│   └── ...
├── lib/
│   ├── plan-generator.ts # Plan generation logic
│   ├── nutrition.ts      # Nutrition calculations
│   ├── prisma.ts         # Prisma client
│   └── utils.ts          # Utility functions
└── prisma/
    ├── schema.prisma     # Database schema
    └── seed.ts           # Seed script
```

## Training Plan Features

The plan generator creates a progressive training plan with:

- **Periodization**: Base → Build → Specific → Peak → Taper phases
- **Deload Weeks**: Every 4th week reduces volume by 20-30%
- **Recovery Rules**: No consecutive leg + run days, Saturday always rest
- **Running Progression**: Gradual increase from 3 runs/week to 4 runs/week
- **Strength Split**: Upper A/B and Legs (posterior/anterior)
- **Swim & Core**: Integrated recovery and conditioning sessions

## Usage

### Calendar View

- View your weekly training plan
- Click any session to log completion, RPE, distance, pain scores
- Navigate between weeks using the week selector
- Quick actions: "Mark Complete" or "Skip"

### Dashboard

- View weekly running totals and 4-week rolling average
- Track adherence percentage
- Monitor knee pain trends
- Optional weight tracking

### Nutrition

- Automatic calorie target calculation based on your profile
- Macro suggestions (protein, carbs, fats)
- Adjustable activity multiplier based on weekly load
- Long run fueling guide

### Settings

- Update body metrics (height, weight, goal weight)
- Adjust training frequency (runs, swims, strength per week)
- Set sex for accurate BMR calculation

## Database Management

```bash
# View database in Prisma Studio
npm run db:studio

# Create a new migration
npm run db:migrate

# Push schema changes (dev only)
npm run db:push
```

## Notes

- The app uses SQLite for local storage (no external database required)
- All dates are handled in Europe/Helsinki timezone
- The plan is pre-generated from Jan 2, 2026 to Jul 20, 2026
- Mobile-first responsive design

## License

MIT

