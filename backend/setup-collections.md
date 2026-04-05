# FocusFlow PocketBase Setup

## 1. Download PocketBase

Go to https://pocketbase.io/docs/ and download the binary for your OS.
Place it at: `backend/pocketbase`

## 2. Start PocketBase

```bash
chmod +x backend/start.sh
./backend/start.sh
```

Or directly:
```bash
./backend/pocketbase serve --http="127.0.0.1:8090" --dir="./backend/pb_data"
```

## 3. Create Admin Account

Visit http://127.0.0.1:8090/_/ and create an admin account.

## 4. Create Collections

### users (auth collection — already exists, just add fields)
Add to the built-in `users` collection:
- `total_points` (number, default: 0)
- `current_points` (number, default: 0)
- `level` (number, default: 1)
- `streak_days` (number, default: 0)
- `last_active_date` (text)

### tasks
- `user` (relation → users, required)
- `title` (text, required)
- `description` (text)
- `date` (text, required) — format YYYY-MM-DD
- `status` (select: pending | in_progress | completed, default: pending)
- `points_value` (number, default: 10)
- `order` (number, default: 0)
- `category` (select: work | personal | health | learning | other, default: other)
- `completed_at` (text)

API Rules (tasks):
- List: `user = @request.auth.id`
- View: `user = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `user = @request.auth.id`
- Delete: `user = @request.auth.id`

### subtasks
- `task` (relation → tasks, required)
- `title` (text, required)
- `status` (select: pending | in_progress | completed, default: pending)
- `points_value` (number, default: 10)
- `order` (number, default: 0)
- `completed_at` (text)

API Rules (subtasks):
- List: `task.user = @request.auth.id`
- View: `task.user = @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `task.user = @request.auth.id`
- Delete: `task.user = @request.auth.id`

### rewards
- `user` (relation → users, required)
- `title` (text, required)
- `description` (text)
- `cost` (number, required)
- `icon` (text, default: "🎁")
- `is_active` (bool, default: true)

API Rules: same pattern `user = @request.auth.id`

### reward_claims
- `user` (relation → users, required)
- `reward` (relation → rewards, required)
- `points_spent` (number, required)
- `claimed_at` (text)

API Rules: same pattern `user = @request.auth.id`

### recurring_templates
> ⚠️ Esta colección se crea automáticamente via migración (`pb_migrations/`). No necesita crearse manualmente.

- `user` (relation → users, required)
- `title` (text, required)
- `description` (text)
- `category` (select: work | personal | health | learning | other)
- `subtask_templates` (text — JSON array serializado)
- `days` (text — ej: "0,1,2,3,4,5,6")
- `is_active` (bool, default: true)
- `last_generated_date` (text — YYYY-MM-DD, para idempotencia)
- `points_value` (number)

API Rules: same pattern `user = @request.auth.id`

## 5. Start the Astro App

```bash
npm run dev
```

App runs at http://localhost:4321
