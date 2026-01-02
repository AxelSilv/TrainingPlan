# Quick Start Guide

## First Time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   npm run db:push
   ```

3. **Seed the training plan:**
   ```bash
   npm run db:seed
   ```
   This generates your complete training plan from January 2, 2026 to July 20, 2026.

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## What You'll See

- **Calendar Page** (default): Your weekly training schedule
- **Dashboard**: Progress tracking, charts, and adherence metrics
- **Nutrition**: Calorie and macro targets based on your profile
- **Settings**: Update your body metrics and training preferences

## Key Features to Try

1. **View Your Plan**: The calendar shows your complete training plan with all sessions
2. **Log a Session**: Click any session card to log completion, RPE, distance, pain scores
3. **Track Progress**: Check the dashboard to see your weekly running totals and adherence
4. **Adjust Nutrition**: Update your activity level to recalculate calorie targets

## Your Initial Plan

- **Start Date**: January 2, 2026 (Upper Body A already marked as completed)
- **Race Date**: July 20, 2026 (100km trail ultra)
- **Profile**: 183 cm, 89 kg, goal 80 kg
- **Training Split**:
  - Monday: Upper Body A
  - Tuesday: Easy run (if 4 runs/week) + Core
  - Wednesday: Lower Body Prehab + Mobility
  - Thursday: Easy run + Swim
  - Friday: Upper Body B
  - Saturday: Rest day
  - Sunday: Long run

## Notes

- Saturday is always a rest day (no sessions scheduled)
- The plan respects "no consecutive leg and running days" rule
- Deload weeks occur every 4th week (reduced volume)
- The plan progresses through Base → Build → Specific → Peak → Taper phases

## Troubleshooting

**Database errors?**
- Make sure you've run `npm run db:push` first
- Check that `.env` file exists with `DATABASE_URL="file:./dev.db"`

**Plan not showing?**
- Run `npm run db:seed` to generate the plan
- Check the browser console for errors

**Port already in use?**
- Change the port: `npm run dev -- -p 3001`

