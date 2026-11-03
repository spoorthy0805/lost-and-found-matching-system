import os
import sys
from sentence_transformers import SentenceTransformer
import psycopg

MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
DATABASE = "lost_found_practice"
EMAIL = "shristi-step2-demo@example.invalid"
SAMPLES = [
    ("LOST", "Black leather wallet", "Lost a black leather wallet with cards near the college library", "College library"),
    ("FOUND", "Dark leather wallet", "Found a black leather wallet with cards outside the college library", "Outside library"),
    ("LOST", "Silver water bottle", "Lost a stainless steel silver water bottle near the cafeteria", "Cafeteria"),
    ("FOUND", "Steel drinking bottle", "Found a silver stainless steel water bottle at the canteen", "Canteen"),
    ("FOUND", "Blue umbrella", "Found a blue folding umbrella beside the main gate", "Main gate"),
]


def main():
    print("Loading the local sentence embedding model...")
    model = SentenceTransformer(MODEL_NAME)
    if model.get_sentence_embedding_dimension() != 384:
        raise RuntimeError("This model does not produce 384-dimensional embeddings")
    print("Connecting to your practice database...")
    with psycopg.connect(dbname=DATABASE) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id FROM users WHERE email = %s", (EMAIL,))
            row = cur.fetchone()
            if row:
                user_id = row[0]
            else:
                cur.execute("INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING user_id", ("Step 2 Demo", EMAIL, "DEMO_ONLY_NO_LOGIN"))
                user_id = cur.fetchone()[0]

            ids = []
            for kind, title, description, location in SAMPLES:
                cur.execute("SELECT item_id FROM items WHERE user_id = %s AND title = %s AND item_type = %s", (user_id, title, kind))
                row = cur.fetchone()
                if row:
                    item_id = row[0]
                else:
                    cur.execute("INSERT INTO items (user_id, item_type, title, description, location) VALUES (%s, %s, %s, %s, %s) RETURNING item_id", (user_id, kind, title, description, location))
                    item_id = cur.fetchone()[0]
                ids.append(item_id)

            texts = [f"{kind.lower()} item: {title}. {description}" for kind, title, description, _ in SAMPLES]
            vectors = model.encode(texts, normalize_embeddings=True)
            for item_id, vector in zip(ids, vectors):
                vector_literal = "[" + ",".join(str(float(x)) for x in vector) + "]"
                cur.execute("UPDATE items SET embedding = %s::vector, updated_at = NOW() WHERE item_id = %s", (vector_literal, item_id))

            lost_ids = [ids[i] for i, x in enumerate(SAMPLES) if x[0] == "LOST"]
            found_ids = [ids[i] for i, x in enumerate(SAMPLES) if x[0] == "FOUND"]
            cur.execute("""
                SELECT l.item_id, l.title, f.item_id, f.title,
                       1 - (l.embedding <=> f.embedding) AS similarity
                FROM items l CROSS JOIN items f
                WHERE l.item_id = ANY(%s) AND f.item_id = ANY(%s)
                ORDER BY l.item_id, similarity DESC
            """, (lost_ids, found_ids))
            results = cur.fetchall()
            print("\nPotential matches (higher score = more similar):")
            for lost_id, lost_title, found_id, found_title, score in results:
                print(f"{lost_title} -> {found_title} | score: {score:.3f}")
                if score >= 0.45:
                    clipped_score = max(0.0, min(1.0, float(score)))
                    cur.execute("""
                        INSERT INTO matches (lost_item_id, found_item_id, similarity_score)
                        VALUES (%s, %s, %s)
                        ON CONFLICT (lost_item_id, found_item_id)
                        DO UPDATE SET similarity_score = EXCLUDED.similarity_score
                    """, (lost_id, found_id, clipped_score))
            print("\nSaved demo pairs scoring at least 0.45 in the matches table.")
            print("0.45 is an example threshold for learning, not a verified accuracy cutoff.")
            print("These are suggested matches, not proof that items belong to someone.")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Error: {exc}", file=sys.stderr)
        sys.exit(1)
