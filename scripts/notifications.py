import argparse
import os
import sys
import psycopg

DATABASE = os.getenv('PGDATABASE', 'lost_found_practice')


def connect():
    return psycopg.connect(dbname=DATABASE)


def ensure_user(cur, user_id):
    cur.execute('SELECT user_id FROM users WHERE user_id = %s', (user_id,))
    if cur.fetchone() is None:
        raise ValueError(f'User ID {user_id} not found')


def list_notifications(user_id, unread_only):
    with connect() as conn:
        with conn.cursor() as cur:
            ensure_user(cur, user_id)
            cur.execute('SELECT notification_id, message, is_read, created_at FROM notifications WHERE user_id = %s AND (%s = FALSE OR is_read = FALSE) ORDER BY created_at DESC, notification_id DESC', (user_id, unread_only))
            rows = cur.fetchall()
            if not rows:
                print('No notifications found.')
            for nid, message, is_read, created_at in rows:
                print(f'ID {nid} | {"READ" if is_read else "UNREAD"} | {created_at} | {message}')


def count_unread(user_id):
    with connect() as conn:
        with conn.cursor() as cur:
            ensure_user(cur, user_id)
            cur.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s AND is_read = FALSE', (user_id,))
            print(f'Unread notifications for user {user_id}: {cur.fetchone()[0]}')


def mark_read(user_id, notification_id):
    with connect() as conn:
        with conn.cursor() as cur:
            ensure_user(cur, user_id)
            cur.execute('UPDATE notifications SET is_read = TRUE WHERE notification_id = %s AND user_id = %s RETURNING notification_id', (notification_id, user_id))
            if cur.fetchone() is None:
                raise ValueError('Notification not found for this user')
            print(f'Notification {notification_id} marked as read.')


def mark_all_read(user_id):
    with connect() as conn:
        with conn.cursor() as cur:
            ensure_user(cur, user_id)
            cur.execute('UPDATE notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE', (user_id,))
            print(f'Marked {cur.rowcount} notification(s) as read for user {user_id}.')


def send_demo(user_id):
    with connect() as conn:
        with conn.cursor() as cur:
            ensure_user(cur, user_id)
            cur.execute('INSERT INTO notifications (user_id, message) VALUES (%s, %s) RETURNING notification_id', (user_id, 'Step 4 demo: your notifications are working.'))
            print(f'Demo notification created: ID {cur.fetchone()[0]} for user {user_id}.')


def main():
    parser = argparse.ArgumentParser(description='Local notifications demo; not an authenticated website API')
    sub = parser.add_subparsers(dest='action', required=True)
    p = sub.add_parser('list')
    p.add_argument('--user-id', type=int, required=True)
    p.add_argument('--unread-only', action='store_true')
    p = sub.add_parser('count')
    p.add_argument('--user-id', type=int, required=True)
    p = sub.add_parser('read')
    p.add_argument('--user-id', type=int, required=True)
    p.add_argument('--notification-id', type=int, required=True)
    p = sub.add_parser('read-all')
    p.add_argument('--user-id', type=int, required=True)
    p = sub.add_parser('demo')
    p.add_argument('--user-id', type=int, required=True)
    args = parser.parse_args()
    if args.action == 'list':
        list_notifications(args.user_id, args.unread_only)
    elif args.action == 'count':
        count_unread(args.user_id)
    elif args.action == 'read':
        mark_read(args.user_id, args.notification_id)
    elif args.action == 'read-all':
        mark_all_read(args.user_id)
    elif args.action == 'demo':
        send_demo(args.user_id)


if __name__ == '__main__':
    try:
        main()
    except (psycopg.Error, ValueError) as exc:
        print(f'Error: {exc}', file=sys.stderr)
        sys.exit(1)
