import argparse
import os
import sys

import psycopg
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"


def database_connection():
    settings = {"dbname": os.getenv("DB_NAME") or os.getenv("PGDATABASE") or "lost_found_practice"}
    for env_name, key in (("DB_HOST", "host"), ("DB_PORT", "port"), ("DB_USER", "user"), ("DB_PASSWORD", "password")):
        value = os.getenv(env_name)
        if value:
            settings[key] = value
    return psycopg.connect(**settings)


def as_vector(values):
    return "[" + ",".join(str(float(number)) for number in values) + "]"


def text_for_item(item):
    return f"{item[2]}: {item[3]}. {item[4] or ''}"


def main():
    parser = argparse.ArgumentParser(description="Preview or save real-item matches")
    parser.add_argument("--item-id", type=int, required=True)
    parser.add_argument("--threshold", type=float, default=0.45)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()

    if args.item_id <= 0 or not 0 <= args.threshold <= 1:
        raise ValueError("Item ID must be positive and threshold must be between 0 and 1")

    with database_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT item_id, user_id, item_type, title, description, status FROM items WHERE item_id = %s", (args.item_id,))
            target = cur.fetchone()
            if target is None:
                raise ValueError("Item ID not found")
            if target[2] not in ("LOST", "FOUND") or target[5] not in ("OPEN", "MATCHED"):
                raise ValueError("Item must be an OPEN or MATCHED LOST/FOUND report")

            opposite = "FOUND" if target[2] == "LOST" else "LOST"
            cur.execute(
                "SELECT item_id, user_id, item_type, title, description, status FROM items WHERE item_type = %s AND status IN ('OPEN', 'MATCHED') AND item_id <> %s AND user_id <> %s ORDER BY item_id",
                (opposite, target[0], target[1]),
            )
            candidates = cur.fetchall()
            print(f"Target: #{target[0]} {target[2]} — {target[3]}")
            print(f"Opposite-type candidates from other accounts: {len(candidates)}")
            if not candidates:
                print("No eligible candidates. No changes made.")
                return

            model = SentenceTransformer(MODEL_NAME)
            if model.get_sentence_embedding_dimension() != 384:
                raise RuntimeError("Embedding model must generate exactly 384 dimensions")
            entries = [target, *candidates]
            embeddings = model.encode([text_for_item(item) for item in entries], normalize_embeddings=True)
            vector_strings = [as_vector(vector) for vector in embeddings]

            passing = []
            print("\nSimilarity results:")
            for candidate, candidate_vector in zip(candidates, vector_strings[1:]):
                cur.execute("SELECT 1 - (%s::vector <=> %s::vector)", (vector_strings[0], candidate_vector))
                score = float(cur.fetchone()[0])
                print(f"  #{candidate[0]} {candidate[3]}: {score:.3f}")
                if score >= args.threshold:
                    passing.append((candidate, max(0.0, min(score, 1.0))))

            if not args.apply:
                print(f"\nPREVIEW ONLY: {len(passing)} pairs meet threshold {args.threshold:.2f}. No changes made.")
                return

            for item, vector in zip(entries, vector_strings):
                cur.execute("UPDATE items SET embedding = %s::vector, updated_at = NOW() WHERE item_id = %s", (vector, item[0]))
            saved = 0
            for candidate, score in passing:
                lost_id, found_id = (target[0], candidate[0]) if target[2] == "LOST" else (candidate[0], target[0])
                cur.execute(
                    "INSERT INTO matches (lost_item_id, found_item_id, similarity_score) VALUES (%s, %s, %s) ON CONFLICT (lost_item_id, found_item_id) DO NOTHING RETURNING match_id",
                    (lost_id, found_id, score),
                )
                if cur.fetchone():
                    saved += 1
            print(f"\nSaved embeddings for {len(entries)} items and inserted {saved} new matches.")
            print("Previously existing matches and review statuses were not overwritten.")


if __name__ == "__main__":
    try:
        main()
    except (psycopg.Error, ValueError, RuntimeError) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
