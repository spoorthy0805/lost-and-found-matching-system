
import os
import sys
from pathlib import Path

import psycopg
from sentence_transformers import SentenceTransformer

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
THRESHOLD = 0.45


def load_env():
    env_file = Path(__file__).resolve().parent.parent / ".env.local"
    if not env_file.exists():
        raise RuntimeError(".env.local file not found")

    for line in env_file.read_text(encoding="utf-8-sig").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def connect_db():
    return psycopg.connect(
        host=os.environ["DB_HOST"],
        port=int(os.environ.get("DB_PORT", "5432")),
        dbname=os.environ["DB_NAME"],
        user=os.environ["DB_USER"],
        password=os.environ["DB_PASSWORD"],
    )


def main():
    load_env()

    print("Loading AI model...")
    model = SentenceTransformer(MODEL_NAME)

    if model.get_sentence_embedding_dimension() != 384:
        raise RuntimeError("Expected a 384-dimensional embedding model")

    with connect_db() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT item_id, item_type, title, description, location
                FROM items
                WHERE status IN ('OPEN', 'MATCHED')
                ORDER BY item_id
            """)
            items = cur.fetchall()

            if not items:
                print("No active items found.")
                return

            print(f"Found {len(items)} active items.")

            texts = [
                f"{title}. {description}. Location: {location}"
                for _, _, title, description, location in items
            ]

            vectors = model.encode(texts, normalize_embeddings=True)

            for item, vector in zip(items, vectors):
                item_id = item[0]
                vector_text = "[" + ",".join(str(float(x)) for x in vector) + "]"

                cur.execute("""
                    UPDATE items
                    SET embedding = %s::vector
                    WHERE item_id = %s
                """, (vector_text, item_id))

            print("Embeddings generated successfully.")

            cur.execute("""
                SELECT
                    l.item_id,
                    l.title,
                    f.item_id,
                    f.title,
                    1 - (l.embedding <=> f.embedding) AS similarity
                FROM items l
                JOIN items f
                    ON l.item_type = 'LOST'
                    AND f.item_type = 'FOUND'
                    AND l.category_id = f.category_id
                    AND l.user_id <> f.user_id
                WHERE l.status IN ('OPEN', 'MATCHED')
                  AND f.status IN ('OPEN', 'MATCHED')
                  AND l.embedding IS NOT NULL
                  AND f.embedding IS NOT NULL
                ORDER BY similarity DESC
            """)

            results = cur.fetchall()
            saved = 0

            for lost_id, lost_title, found_id, found_title, score in results:
                if score is None or score < THRESHOLD:
                    continue

                score = max(0.0, min(1.0, float(score)))

                cur.execute("""
                    INSERT INTO matches
                        (lost_item_id, found_item_id, similarity_score)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (lost_item_id, found_item_id)
                    DO UPDATE SET
                        similarity_score = EXCLUDED.similarity_score
                    WHERE matches.status = 'PENDING'
                """, (lost_id, found_id, score))

                saved += 1
                print(
                    f"{lost_title} <-> {found_title} | "
                    f"Similarity: {score:.3f}"
                )

            print(f"Matching completed. {saved} candidate pairs saved.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
