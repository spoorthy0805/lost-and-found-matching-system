BEGIN;

CREATE ROLE lost_found_demo_reader NOLOGIN;
CREATE ROLE lost_found_demo_writer NOLOGIN;

GRANT USAGE ON SCHEMA public TO lost_found_demo_reader, lost_found_demo_writer;

GRANT SELECT ON users, categories, items, matches, claims, notifications
TO lost_found_demo_reader;

GRANT SELECT, INSERT, UPDATE ON items
TO lost_found_demo_writer;

SELECT
    r.rolname,
    r.rolcanlogin,
    has_table_privilege(r.oid, 'public.items', 'SELECT') AS can_read_items,
    has_table_privilege(r.oid, 'public.items', 'INSERT') AS can_insert_items,
    has_table_privilege(r.oid, 'public.items', 'DELETE') AS can_delete_items
FROM pg_roles r
WHERE r.rolname IN (
    'lost_found_demo_reader',
    'lost_found_demo_writer'
)
ORDER BY r.rolname;

ROLLBACK;
