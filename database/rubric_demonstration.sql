BEGIN;

CREATE FUNCTION pg_temp.item_report_count(p_user_id INTEGER)
RETURNS INTEGER
LANGUAGE SQL
AS $$
    SELECT COUNT(*)::INTEGER
    FROM items
    WHERE user_id = p_user_id;
$$;

SELECT
    u.user_id,
    u.name,
    pg_temp.item_report_count(u.user_id) AS total_reports
FROM users u
ORDER BY total_reports DESC
LIMIT 10;

SELECT
    i.item_id,
    i.title,
    i.item_type,
    u.name AS reported_by,
    c.category_name
FROM items i
JOIN users u ON u.user_id = i.user_id
LEFT JOIN categories c ON c.category_id = i.category_id
ORDER BY i.item_id DESC
LIMIT 10;

SELECT
    i.item_id,
    i.title
FROM items i
WHERE EXISTS (
    SELECT 1
    FROM matches m
    WHERE m.lost_item_id = i.item_id
       OR m.found_item_id = i.item_id
)
ORDER BY i.item_id;

WITH category_counts AS (
    SELECT
        category_id,
        COUNT(*) AS total_items
    FROM items
    GROUP BY category_id
)
SELECT
    c.category_name,
    COALESCE(cc.total_items, 0) AS total_items
FROM categories c
LEFT JOIN category_counts cc
    ON cc.category_id = c.category_id
ORDER BY total_items DESC;

WITH RECURSIVE numbers(n) AS (
    SELECT 1
    UNION ALL
    SELECT n + 1
    FROM numbers
    WHERE n < 5
)
SELECT n FROM numbers;

CREATE TABLE rubric_audit_demo (
    audit_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_message TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE FUNCTION rubric_audit_function()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO rubric_audit_demo (event_message)
    VALUES ('Inserted demo record: ' || NEW.demo_name);
    RETURN NEW;
END;
$$;

CREATE TABLE rubric_item_demo (
    demo_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    demo_name TEXT NOT NULL
);

CREATE TRIGGER rubric_insert_trigger
AFTER INSERT ON rubric_item_demo
FOR EACH ROW
EXECUTE FUNCTION rubric_audit_function();

INSERT INTO rubric_item_demo (demo_name)
VALUES ('Lost Wallet');

UPDATE rubric_item_demo
SET demo_name = 'Black Wallet'
WHERE demo_name = 'Lost Wallet';

SELECT * FROM rubric_item_demo;
SELECT * FROM rubric_audit_demo;

DELETE FROM rubric_item_demo
WHERE demo_name = 'Black Wallet';

SELECT
    item_id,
    title,
    embedding <=> (
        SELECT embedding
        FROM items
        WHERE embedding IS NOT NULL
        ORDER BY item_id
        LIMIT 1
    ) AS cosine_distance
FROM items
WHERE embedding IS NOT NULL
ORDER BY cosine_distance
LIMIT 5;

SELECT
    lost_item_id,
    found_item_id,
    similarity_score
FROM matches
ORDER BY similarity_score DESC
LIMIT 10;

SELECT
    rolname,
    rolcanlogin,
    rolsuper
FROM pg_roles
WHERE rolname = CURRENT_USER;

ROLLBACK;
