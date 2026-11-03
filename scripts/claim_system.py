import argparse
import os
import sys
import psycopg

DATABASE = os.getenv('PGDATABASE', 'lost_found_practice')
DEMO_USER_EMAIL = 'shristi-step2-demo@example.invalid'
DEMO_ADMIN_EMAIL = 'shristi-step3-admin@example.invalid'


def connect():
    return psycopg.connect(dbname=DATABASE)


def seed_admin():
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT user_id, role FROM users WHERE email = %s', (DEMO_ADMIN_EMAIL,))
            row = cur.fetchone()
            if row:
                if row[1] != 'ADMIN':
                    raise ValueError('Existing demo account does not have ADMIN role')
                admin_id = row[0]
            else:
                cur.execute('INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING user_id', ('Step 3 Demo Admin', DEMO_ADMIN_EMAIL, 'DEMO_ONLY_NO_LOGIN', 'ADMIN'))
                admin_id = cur.fetchone()[0]
            cur.execute('SELECT user_id FROM users WHERE email = %s', (DEMO_USER_EMAIL,))
            claimant = cur.fetchone()
            if not claimant:
                raise ValueError('Step 2 demo user not found. Run smart_match.py first.')
            print(f'Demo claimant user ID: {claimant[0]}')
            print(f'Demo admin user ID: {admin_id}')


def matches():
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute('''SELECT m.match_id, l.title, f.title, ROUND(m.similarity_score::numeric, 3), m.status, l.user_id
                           FROM matches m JOIN items l ON l.item_id = m.lost_item_id
                           JOIN items f ON f.item_id = m.found_item_id ORDER BY m.similarity_score DESC, m.match_id''')
            rows = cur.fetchall()
            if not rows:
                print('No saved matches. Run Step 2 smart_match.py first.')
            for match_id, lost, found, score, status, owner in rows:
                print(f'Match {match_id}: {lost} -> {found} | similarity {score} | status {status} | lost item owner ID {owner}')


def claim(match_id, user_id, message):
    if not message.strip():
        raise ValueError('Claim message cannot be blank')
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute('''SELECT m.status, l.user_id, l.item_type, f.item_type
                           FROM matches m JOIN items l ON l.item_id = m.lost_item_id
                           JOIN items f ON f.item_id = m.found_item_id WHERE m.match_id = %s''', (match_id,))
            row = cur.fetchone()
            if not row:
                raise ValueError('Match ID not found')
            status, owner, lost_type, found_type = row
            if status != 'PENDING':
                raise ValueError('Only pending matches accept new claims in this demo')
            if lost_type != 'LOST' or found_type != 'FOUND':
                raise ValueError('Match items have incorrect LOST/FOUND types')
            if user_id != owner:
                raise ValueError('For this demo, only the lost-item owner may submit a claim')
            cur.execute('''INSERT INTO claims (match_id, claimer_id, message)
                           VALUES (%s, %s, %s) RETURNING claim_id''', (match_id, user_id, message.strip()))
            claim_id = cur.fetchone()[0]
            cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)', (user_id, f'Claim #{claim_id} submitted for match #{match_id}; awaiting review.'))
            print(f'Claim submitted: claim_id={claim_id}, status=PENDING')


def claims():
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute('''SELECT c.claim_id, c.match_id, c.claimer_id, c.status, c.message
                           FROM claims c ORDER BY c.claim_id''')
            rows = cur.fetchall()
            if not rows:
                print('No claims yet.')
            for claim_id, match_id, user_id, status, msg in rows:
                print(f'Claim {claim_id} | match {match_id} | user {user_id} | {status} | {msg}')


def review(claim_id, admin_id, decision):
    decision = decision.upper()
    if decision not in ('APPROVED', 'REJECTED'):
        raise ValueError('Decision must be APPROVED or REJECTED')
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT role FROM users WHERE user_id = %s", (admin_id,))
            row = cur.fetchone()
            if not row or row[0] != 'ADMIN':
                raise ValueError('The selected reviewer must have the ADMIN role')
            cur.execute('SELECT match_id, claimer_id, status FROM claims WHERE claim_id = %s FOR UPDATE', (claim_id,))
            row = cur.fetchone()
            if not row:
                raise ValueError('Claim ID not found')
            match_id, owner, status = row
            if status != 'PENDING':
                raise ValueError('This claim was already reviewed')
            cur.execute('SELECT status FROM matches WHERE match_id = %s FOR UPDATE', (match_id,))
            match_status = cur.fetchone()
            if not match_status or match_status[0] != 'PENDING':
                raise ValueError('This match is not pending')
            cur.execute('''UPDATE claims SET status = %s, reviewed_by = %s, decision_date = NOW()
                           WHERE claim_id = %s''', (decision, admin_id, claim_id))
            if decision == 'APPROVED':
                cur.execute("UPDATE matches SET status = 'REVIEWED' WHERE match_id = %s", (match_id,))
                cur.execute("UPDATE claims SET status = 'REJECTED', reviewed_by = %s, decision_date = NOW() WHERE match_id = %s AND claim_id <> %s AND status = 'PENDING' RETURNING claimer_id, claim_id", (admin_id, match_id, claim_id))
                for other_user, other_claim in cur.fetchall():
                    cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)', (other_user, f'Claim #{other_claim} was REJECTED because another claim was approved.'))
            cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s)', (owner, f'Claim #{claim_id} for match #{match_id} was {decision}.'))
            print(f'Claim {claim_id}: {decision} by admin user {admin_id}')


def notifications(user_id):
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute('SELECT notification_id, message, is_read FROM notifications WHERE user_id = %s ORDER BY notification_id DESC', (user_id,))
            rows = cur.fetchall()
            if not rows:
                print('No notifications for this user.')
            for nid, msg, read in rows:
                print(f'Notification {nid} | {"READ" if read else "UNREAD"} | {msg}')


def main():
    parser = argparse.ArgumentParser(description='Local practice Claim System (not authenticated production API)')
    sub = parser.add_subparsers(dest='action', required=True)
    sub.add_parser('seed-admin')
    sub.add_parser('matches')
    p = sub.add_parser('claim')
    p.add_argument('--match-id', type=int, required=True)
    p.add_argument('--user-id', type=int, required=True)
    p.add_argument('--message', required=True)
    sub.add_parser('claims')
    p = sub.add_parser('review')
    p.add_argument('--claim-id', type=int, required=True)
    p.add_argument('--admin-id', type=int, required=True)
    p.add_argument('--decision', required=True, choices=['APPROVED', 'REJECTED'])
    p = sub.add_parser('notifications')
    p.add_argument('--user-id', type=int, required=True)
    args = parser.parse_args()
    if args.action == 'seed-admin': seed_admin()
    elif args.action == 'matches': matches()
    elif args.action == 'claim': claim(args.match_id, args.user_id, args.message)
    elif args.action == 'claims': claims()
    elif args.action == 'review': review(args.claim_id, args.admin_id, args.decision)
    elif args.action == 'notifications': notifications(args.user_id)


if __name__ == '__main__':
    try:
        main()
    except (psycopg.Error, ValueError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
