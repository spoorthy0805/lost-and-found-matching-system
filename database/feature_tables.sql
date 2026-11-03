CREATE TABLE IF NOT EXISTS matches (
    match_id SERIAL PRIMARY KEY,
    lost_item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    found_item_id INTEGER NOT NULL REFERENCES items(item_id) ON DELETE CASCADE,
    similarity_score DOUBLE PRECISION NOT NULL CHECK (similarity_score >= 0 AND similarity_score <= 1),
    match_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'REVIEWED', 'REJECTED')),
    CONSTRAINT unique_item_pair UNIQUE (lost_item_id, found_item_id),
    CONSTRAINT different_items CHECK (lost_item_id <> found_item_id)
);

CREATE TABLE IF NOT EXISTS claims (
    claim_id SERIAL PRIMARY KEY,
    match_id INTEGER NOT NULL REFERENCES matches(match_id) ON DELETE CASCADE,
    claimer_id INTEGER NOT NULL REFERENCES users(user_id),
    message TEXT NOT NULL CHECK (length(trim(message)) > 0),
    claim_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by INTEGER REFERENCES users(user_id),
    decision_date TIMESTAMPTZ,
    CONSTRAINT review_details_consistent CHECK (
        (status = 'PENDING' AND reviewed_by IS NULL AND decision_date IS NULL)
        OR (status IN ('APPROVED', 'REJECTED') AND reviewed_by IS NOT NULL AND decision_date IS NOT NULL)
    ),
    CONSTRAINT one_claim_per_user_per_match UNIQUE (match_id, claimer_id)
);

CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL CHECK (length(trim(message)) > 0),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matches_lost ON matches(lost_item_id);
CREATE INDEX IF NOT EXISTS idx_matches_found ON matches(found_item_id);
CREATE INDEX IF NOT EXISTS idx_claims_match ON claims(match_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
