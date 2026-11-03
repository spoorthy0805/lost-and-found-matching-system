BEGIN;

DO $$
DECLARE
    owner_id INTEGER;
    finder_id INTEGER;
    admin_id INTEGER;
    lost_id INTEGER;
    found_id INTEGER;
    new_match_id INTEGER;
    new_claim_id INTEGER;
    new_notification_id INTEGER;
BEGIN
    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Demo Owner', 'shristi-owner-test@example.invalid', 'test-only-not-a-real-hash', 'USER')
    RETURNING user_id INTO owner_id;

    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Demo Finder', 'shristi-finder-test@example.invalid', 'test-only-not-a-real-hash', 'USER')
    RETURNING user_id INTO finder_id;

    INSERT INTO users (name, email, password_hash, role)
    VALUES ('Demo Admin', 'shristi-admin-test@example.invalid', 'test-only-not-a-real-hash', 'ADMIN')
    RETURNING user_id INTO admin_id;

    INSERT INTO items (user_id, item_type, title, description, location, status)
    VALUES (owner_id, 'LOST', 'Black wallet', 'Lost near library', 'Library', 'OPEN')
    RETURNING item_id INTO lost_id;

    INSERT INTO items (user_id, item_type, title, description, location, status)
    VALUES (finder_id, 'FOUND', 'Black wallet', 'Found at library entrance', 'Library', 'OPEN')
    RETURNING item_id INTO found_id;

    INSERT INTO matches (lost_item_id, found_item_id, similarity_score)
    VALUES (lost_id, found_id, 0.92)
    RETURNING match_id INTO new_match_id;

    INSERT INTO claims (match_id, claimer_id, message)
    VALUES (new_match_id, owner_id, 'This wallet is mine. It has a blue card.')
    RETURNING claim_id INTO new_claim_id;

    INSERT INTO notifications (user_id, message)
    VALUES (owner_id, 'A possible match for your black wallet was found.')
    RETURNING notification_id INTO new_notification_id;

    IF NOT EXISTS (SELECT 1 FROM matches WHERE match_id = new_match_id AND similarity_score = 0.92) THEN
        RAISE EXCEPTION 'Match test failed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM claims WHERE claim_id = new_claim_id AND status = 'PENDING') THEN
        RAISE EXCEPTION 'Claim test failed';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM notifications WHERE notification_id = new_notification_id AND is_read = FALSE) THEN
        RAISE EXCEPTION 'Notification test failed';
    END IF;

    UPDATE claims
    SET status = 'APPROVED', reviewed_by = admin_id, decision_date = NOW()
    WHERE claim_id = new_claim_id;

    IF NOT EXISTS (SELECT 1 FROM claims WHERE claim_id = new_claim_id AND status = 'APPROVED' AND reviewed_by = admin_id) THEN
        RAISE EXCEPTION 'Approval test failed';
    END IF;

    UPDATE notifications SET is_read = TRUE WHERE notification_id = new_notification_id;

    IF NOT EXISTS (SELECT 1 FROM notifications WHERE notification_id = new_notification_id AND is_read = TRUE) THEN
        RAISE EXCEPTION 'Read notification test failed';
    END IF;

    RAISE NOTICE 'PASS: match inserted with score 0.92';
    RAISE NOTICE 'PASS: claim created and approved';
    RAISE NOTICE 'PASS: notification created and marked read';
    RAISE NOTICE 'PASS: test records will be rolled back';
END;
$$;

ROLLBACK;
