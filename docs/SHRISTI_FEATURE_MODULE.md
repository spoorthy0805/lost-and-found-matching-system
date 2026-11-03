# Lost & Found Management System — Matching and Claim Management Module

## Project Overview

This module implements AI-assisted lost and found item matching, ownership claim management, notifications, and administrative review as part of a college Lost & Found Management System.

The system is built using PostgreSQL, pgvector, Python, Sentence Transformers, and Next.js.

## Features Implemented

### 1. Database Management

- Created PostgreSQL tables for matches, claims, and notifications.
- Implemented primary keys, foreign keys, and database constraints.
- Connected the feature tables with users and items.

### 2. AI-Based Smart Matching

- Used the `all-MiniLM-L6-v2` Sentence Transformers model.
- Generated 384-dimensional text embeddings for item descriptions.
- Used pgvector cosine similarity to identify possible lost and found item matches.
- Stored potential matches in the PostgreSQL database.

### 3. Claim Management

- Implemented ownership claim submission.
- Added pending, approved, and rejected claim statuses.
- Implemented administrative claim review.

### 4. Notification System

- Implemented notification creation and retrieval.
- Added unread notification counts.
- Added functionality to mark notifications as read.

### 5. Admin Dashboard

- Implemented claim overview and status filtering.
- Added claim approval and rejection.
- Connected administrative decisions with notifications.

### 6. Next.js Web Demonstration

- Created a local web interface for viewing potential matches.
- Added claim submission through the website.
- Added notifications and administrative review pages.
- Connected the website to PostgreSQL.

## Technologies Used

| Component | Technology |
|---|---|
| Database | PostgreSQL |
| Vector Similarity | pgvector |
| AI Model | Sentence Transformers — all-MiniLM-L6-v2 |
| Backend Scripts | Python |
| Database Connectivity | psycopg, node-postgres |
| Web Framework | Next.js, React |

## Folder Structure

- `Database/` — SQL schema and database test files
- `Scripts/` — AI matching, claim, notification, and admin functionality
- `Web_demo/` — Local Next.js demonstration website
- `Docs/` — Project integration documentation

## Testing Completed

The following functionality was tested locally:

- PostgreSQL database connection and table creation
- pgvector cosine similarity
- AI embedding generation and item matching
- Claim submission and administrative review
- Notification creation, retrieval, and read status updates
- Local Next.js website functionality

## Current Project Status

The individual module has been implemented and tested locally.

Integration with the shared team application is the next stage of development. This includes connecting the existing authentication system, shared database schema, and newly submitted items to the matching workflow.

## Important Notes

The `Web_demo` folder is a local prototype that uses fixed demonstration user IDs. It is not intended for public deployment without authentication and authorization improvements.

The matching similarity threshold is experimental and does not establish proof of ownership.

The `Database/demo` files are intended only for independent practice and testing.