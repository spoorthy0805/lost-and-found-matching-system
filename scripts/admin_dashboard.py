import argparse
import os
import sys
import psycopg

DATABASE = os.getenv('PGDATABASE', 'lost_found_practice')


def connect():
    return psycopg.connect(dbname=DATABASE)


def require_admin(cur, admin_id):
    cur.execute('SELECT role FROM users WHERE user_id = %s', (admin_id,))
    row = cur.fetchone()
    if row is None or row[0] != 'ADMIN':
        raise ValueError(f'User {admin_id} is not a valid admin')


def overview(admin_id):
    with connect() as conn:
        with conn.cursor() as cur:
            require_admin(cur, admin_id)
            cur.execute('SELECT status, COUNT(*) FROM claims GROUP BY status ORDER BY status')
            counts = dict(cur.fetchall())
            cur.execute("SELECT COUNT(*) FROM matches WHERE status = 'PENDING'")
            waiting_matches = cur.fetchone()[0]
            print('ADMIN OVERVIEW')
            print(f'Pending claims: {counts.get("PENDING", 0)}')
            print(f'Approved claims: {counts.get("APPROVED", 0)}')
            print(f'Rejected claims: {counts.get("REJECTED", 0)}')
            print(f'Pending potential matches: {waiting_matches}')


def list_claims(admin_id, status):
    with connect() as conn:
        with conn.cursor() as cur:
            require_admin(cur, admin_id)
            cur.execute('''SELECT c.claim_id, c.status, c.claimer_id, c.match_id,
                                  l.title, f.title, c.message
                           FROM claims c
                           JOIN matches m ON m.match_id = c.match_id
                           JOIN items l ON l.item_id = m.lost_item_id
                           JOIN items f ON f.item_id = m.found_item_id
                           WHERE (%s::text IS NULL OR c.status = %s)
                           ORDER BY c.claim_id''', (status, status))
            rows = cur.fetchall()
            if not rows:
                print('No claims found.')
            for claim_id, claim_status, claimant, match_id, lost, found, message in rows:
                print(f'Claim {claim_id} | {claim_status} | student {claimant} | match {match_id}')
                print(f'  LOST: {lost} -> FOUND: {found}')
                print(f'  Explanation: {message}')


def review_claim(admin_id, claim_id, decision):
    with connect() as conn:
        with conn.cursor() as cur:
            require_admin(cur, admin_id)
            cur.execute('SELECT match_id, claimer_id, status FROM claims WHERE claim_id = %s FOR UPDATE', (claim_id,))
            row = cur.fetchone()
            if row is None:
                raise ValueError('Claim ID not found')
            match_id, claimant_id, claim_status = row
            if claim_status != 'PENDING':
                raise ValueError('Claim already reviewed; no changes made')
            cur.execute('SELECT status FROM matches WHERE match_id = %s FOR UPDATE', (match_id,))
            match_row = cur.fetchone()
            if match_row is None or match_row[0] != 'PENDING':
                raise ValueError('Associated match is not pending; no changes made')
            cur.execute('''UPDATE claims SET status = %s, reviewed_by = %s, decision_date = NOW()
                           WHERE claim_id = %s''', (decision, admin_id, claim_id))
            if decision == 'APPROVED':
                cur.execute("UPDATE matches SET status = 'REVIEWED' WHERE match_id = %s", (match_id,))
                cur.execute('''UPDATE claims SET status = 'REJECTED', reviewed_by = %s,
                               decision_date = NOW()
                               WHERE match_id = %s AND claim_id <> %s AND status = 'PENDING'
                               RETURNING claim_id, claimer_id''', (admin_id, match_id, claim_id))
                for other_claim_id, other_user_id in cur.fetchall():
                    cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)',
                                (other_user_id, f'Claim #{other_claim_id} was REJECTED because another claim was approved.'))
            cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)',
                        (claimant_id, f'Claim #{claim_id} for match #{match_id} was {decision}.'))
            print(f'Claim {claim_id}: {decision} by admin user {admin_id}')
            print(f'Notification saved for user {claimant_id}.')


def create_demo_claim(admin_id):
    with connect() as conn:
        with conn.cursor() as cur:
            require_admin(cur, admin_id)
            cur.execute('''SELECT m.match_id, l.user_id
                           FROM matches m
                           JOIN items l ON l.item_id = m.lost_item_id
                           JOIN items f ON f.item_id = m.found_item_id
                           WHERE m.status = 'PENDING' AND l.item_type = 'LOST'
                             AND f.item_type = 'FOUND'
                             AND NOT EXISTS (SELECT 1 FROM claims c WHERE c.match_id = m.match_id)
                           ORDER BY m.match_id LIMIT 1''')
            row = cur.fetchone()
            if row is None:
                print('No unused pending demo matches available.')
                print('Do not reuse an already-approved claim. Make a new matching pair in Step 2 first.')
                return
            match_id, owner_id = row
            cur.execute('''INSERT INTO claims (match_id, claimer_id, message)
                           VALUES (%s, %s, %s) RETURNING claim_id''',
                        (match_id, owner_id, 'Demo ownership claim for admin dashboard testing.'))
            claim_id = cur.fetchone()[0]
            cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)',
                        (owner_id, f'Claim #{claim_id} submitted for match #{match_id}; awaiting review.'))
            print(f'Created demo claim ID {claim_id} for match ID {match_id}, claimant ID {owner_id}.')


def main():
    parser = argparse.ArgumentParser(description='Local-only admin dashboard demo, not a secure website')
    parser.add_argument('--admin-id', type=int, required=True)
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('overview')
    p = sub.add_parser('claims')
    p.add_argument('--status', choices=['PENDING', 'APPROVED', 'REJECTED'])
    sub.add_parser('seed-demo-claim')
    p = sub.add_parser('review')
    p.add_argument('--claim-id', type=int, required=True)
    p.add_argument('--decision', choices=['APPROVED', 'REJECTED'], required=True)
    args = parser.parse_args()
    if args.action == 'overview':
        overview(args.admin_id)
    elif args.action == 'claims':
        list_claims(args.admin_id, args.status)
    elif args.action == 'seed-demo-claim':
        create_demo_claim(args.admin_id)
    elif args.action == 'review':
        review_claim(args.admin_id, args.claim_id, args.decision)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, psycopg.Error) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
