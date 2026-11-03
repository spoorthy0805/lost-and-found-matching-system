# Integration Notes — Matching and Claim Management

## Completed Modules

- AI-based matching using Sentence Transformers and pgvector
- PostgreSQL tables for matches, claims, and notifications
- Ownership claim submission and review
- Notification management
- Admin review functionality
- Local Next.js demonstration

## Existing Team Application

The team application already includes:
- User registration and login
- Lost and found item reporting
- Item listing and management
- PostgreSQL database connection

## Integration Plan

1. Preserve the existing team's `src/app` pages.
2. Use the shared PostgreSQL connection at `src/lib/db.js`.
3. Apply matching, claims, and notifications schema changes after verifying database compatibility.
4. Add matching, claims, notifications, and admin features to the existing Next.js application.
5. Replace demonstration user IDs with authenticated session identities.
6. Enforce authorization and ownership validation on the server.
7. Trigger embedding generation and matching for newly submitted items.
8. Test the full workflow together.

## Current Status

The individual feature module is implemented and has been tested locally. Full integration into the shared website and authentication system is pending.

## Important Notes

The SQL foundation in the `demo` directory is for independent testing only.

The local Next.js demo uses fixed student/admin IDs and should not be deployed publicly.

The AI matching threshold is experimental and is not a verified measure of ownership.