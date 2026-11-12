# Lost & Found AI Matching System

A web-based Lost & Found management system that helps users report missing or discovered belongings, identify potential matches using artificial intelligence, and manage ownership claims.

## Technology Stack

| Component | Technology |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js App Router API routes, Node.js |
| Database | PostgreSQL |
| Vector Storage and Search | pgvector |
| AI Model | sentence-transformers/all-MiniLM-L6-v2 |
| AI Processing | Python, Sentence Transformers, psycopg |
| Authentication | JWT (jose), bcryptjs |

## Features

- User registration and login
- Lost and found item reporting
- Item browsing and searching
- Automatic AI-based matching
- Similarity scores for potential matches
- Ownership claim submission
- Admin claim approval and rejection
- User notifications
- Personal report management
- Retro Pixel user interface

## Database Design

The PostgreSQL database contains six main tables:

| Table | Purpose |
|---|---|
| users | Stores registered users and administrators |
| categories | Stores item categories |
| items | Stores lost and found reports and AI embeddings |
| matches | Stores potential lost-found matches |
| claims | Stores ownership claims and review decisions |
| notifications | Stores user notifications |

### Relationships

- A user can submit multiple item reports.
- A category can contain multiple items.
- Each match references one lost item and one found item.
- A match can have multiple claims from different users.
- Users submit claims, and administrators can review them.
- A user can receive multiple notifications.

The database uses primary keys, foreign keys, unique constraints, check constraints, indexes, and selected cascading-delete relationships.

## AI Matching System

The application uses the `sentence-transformers/all-MiniLM-L6-v2` model to convert item descriptions into 384-dimensional numerical embeddings.

When a user submits a report:

1. The Next.js API validates the authenticated session and submitted information.
2. The report is inserted into PostgreSQL.
3. The API launches `scripts/smart_match.py` using Python.
4. The Python script loads active lost and found reports.
5. It generates normalized embeddings using the Sentence Transformer model.
6. PostgreSQL stores these embeddings using pgvector.
7. The system compares lost and found reports from different users within the same category.
8. Cosine similarity is calculated using pgvector.
9. Matches meeting the threshold are saved in the `matches` table.

The configured similarity threshold is `0.45`.

Similarity is calculated as:

`similarity = 1 - cosine_distance`

A higher score indicates greater semantic similarity. It does not prove ownership.

Existing pending matches can have their similarity scores updated during subsequent matching runs.

If automatic matching fails after report insertion, the report remains saved and the API indicates that matching did not complete.

## Application Pages

| Route | Description |
|---|---|
| / | Homepage and item browsing |
| /register | User registration |
| /login | User login |
| /report-lost | Report a lost item |
| /report-found | Report a found item |
| /matches | View potential AI matches |
| /my-reports | Manage personal reports |
| /notifications | View notifications |
| /admin | Administrator dashboard |

## API Routes

- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/logout`
- `/api/auth/me`
- `/api/items`
- `/api/matches`
- `/api/claims`
- `/api/my-reports`
- `/api/my-reports/[id]`
- `/api/notifications`
- `/api/admin/claims`
- `/api/admin/claims/[id]`

## Local Setup

### Prerequisites

- Node.js compatible with Next.js 16
- Python with virtual environment support
- PostgreSQL
- pgvector PostgreSQL extension
- npm

### 1. Clone the repository

```bash
git clone https://github.com/spoorthy0805/lost-and-found-matching-system.git
cd lost-and-found-matching-system
```

### 2. Install Node.js dependencies

```bash
npm install
```

### 3. Create a Python virtual environment

On Windows:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
```

### 4. Install Python dependencies

```bash
python -m pip install -r scripts/requirements.txt
```

### 5. Configure environment variables

Create a `.env.local` file in the project root.

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=lost_found_db
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
JWT_SECRET=your_secure_jwt_secret
```

Replace the example values with your own database credentials and a secure JWT secret.

Do not commit `.env.local` to GitHub.

### 6. Configure PostgreSQL

Create the project database and enable pgvector.

Apply the database foundation schema and feature tables:

- `database/demo/practice_foundation.sql`
- `database/feature_tables.sql`

The foundation SQL is also used for independent demonstration, so review it before applying it to an existing database. Do not recreate tables over a populated project database.

### 7. Start the application

On Windows:

```powershell
npm.cmd run dev
```

Open http://localhost:3000.

## Project Structure

```text
database/
  demo/
  feature_tables.sql
docs/
public/
scripts/
  smart_match.py
  smart_match_real.py
  requirements.txt
src/
  app/
    api/
    admin/
    login/
    matches/
    my-reports/
    notifications/
    register/
    report-found/
    report-lost/
  lib/
package.json
README.md
```

## Matching Limitations

- AI similarity is a recommendation, not proof of ownership.
- Matching is restricted to reports in the same category.
- Matching compares reports from different user accounts.
- The configured threshold is experimental.
- Ownership claims require review.
- The matching script recalculates embeddings for active reports.

## Project Status

The core application, frontend redesign, database integration, and automatic AI matching implementation are complete.

The production build has passed, and all six expected database tables have been verified.

Final end-to-end regression testing and submission documentation are being completed.
