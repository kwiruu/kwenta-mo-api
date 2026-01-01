# KwentaMo API

NestJS backend for KwentaMo - Food Business Costing Assistant.

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: Supabase Postgres
- **ORM**: Prisma
- **Auth**: Supabase Auth with JWT validation
- **Storage**: Supabase Storage

## Setup

### 1. Install dependencies

```bash
cd kwenta-mo-api
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Push schema to database

```bash
npm run prisma:push
```

Or run migrations:

```bash
npm run prisma:migrate
```

### 5. Start development server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api`

## API Endpoints

### Auth

- `POST /api/auth/sync` - Sync user from Supabase Auth
- `GET /api/auth/me` - Get current user profile

### Users

- `GET /api/users/profile` - Get user profile with business
- `PUT /api/users/business` - Update business profile

### Ingredients

- `GET /api/ingredients` - List all ingredients
- `GET /api/ingredients/:id` - Get ingredient by ID
- `POST /api/ingredients` - Create ingredient
- `POST /api/ingredients/bulk` - Bulk create ingredients
- `PUT /api/ingredients/:id` - Update ingredient
- `DELETE /api/ingredients/:id` - Delete ingredient

### Recipes

- `GET /api/recipes` - List all recipes
- `GET /api/recipes/:id` - Get recipe with ingredients
- `GET /api/recipes/:id/cost` - Calculate recipe cost breakdown
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Sales

- `GET /api/sales` - List sales (with date filters)
- `GET /api/sales/stats` - Get sales statistics
- `GET /api/sales/:id` - Get sale by ID
- `POST /api/sales` - Record sale
- `PUT /api/sales/:id` - Update sale
- `DELETE /api/sales/:id` - Delete sale

### Expenses

- `GET /api/expenses` - List expenses (with filters)
- `GET /api/expenses/stats` - Get expense statistics
- `GET /api/expenses/:id` - Get expense by ID
- `POST /api/expenses` - Create expense
- `POST /api/expenses/bulk` - Bulk create expenses
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Reports

- `GET /api/reports/cogs` - COGS Report
- `GET /api/reports/income-statement` - Income Statement
- `GET /api/reports/profit-summary` - Profit by Recipe
- `GET /api/reports/expense-breakdown` - Expense Breakdown
- `GET /api/reports/dashboard` - Dashboard Summary
- `GET /api/reports/export/csv` - Export data as CSV

## Project Structure

```
src/
├── auth/                 # Auth module (Supabase JWT)
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── auth.module.ts
│   ├── supabase.service.ts
│   └── supabase-auth.guard.ts
├── prisma/              # Database
│   ├── prisma.service.ts
│   └── prisma.module.ts
├── users/               # User & Business profile
├── ingredients/         # Ingredients CRUD
├── recipes/             # Recipes CRUD with cost calc
├── sales/               # Sales recording
├── expenses/            # Expense tracking
├── reports/             # Financial reports
├── app.module.ts
└── main.ts
```

## Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main"]
```

### Environment Variables (Production)

- `DATABASE_URL` - Supabase Postgres connection string
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (production)
