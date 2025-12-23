{{- define "setup_appflowy_db.sql" }}
CREATE EXTENSION IF NOT EXISTS vector;

DO $$
BEGIN
    -- create table to store collab embeddings
    CREATE TABLE IF NOT EXISTS af_collab_embeddings
    (
        fragment_id TEXT NOT NULL PRIMARY KEY,
        oid TEXT NOT NULL,
        partition_key INTEGER NOT NULL,
        content_type INTEGER NOT NULL,
        indexed_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT (NOW()),
        content TEXT,
        embedding VECTOR(1536),
        FOREIGN KEY (oid, partition_key) REFERENCES af_collab (oid, partition_key) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS af_collab_embeddings_similarity_idx ON af_collab_embeddings USING hnsw (embedding vector_cosine_ops);

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'could not create "vector" extension or table, ignoring this migration';
END;
$$ LANGUAGE plpgsql;
{{- end -}}

{{- define "setup.sh" }}
#!/bin/bash
set -e
echo "Waiting to connect to postgres..."
timeout={{ .Values.setupJob.postgresConnectTimeout }}
start_time=$(date +%s)
while true; do
  if pg_isready -h {{ .Values.global.database.host }} -p {{ .Values.global.database.port }} -U {{ .Values.global.database.adminUsername }}; then
    break
  fi
  current_time=$(date +%s)
  elapsed_time=$((current_time - start_time))
  if [ $elapsed_time -ge $timeout ]; then
    echo "Failed to connect to postgres within $timeout seconds."
    exit 1
  fi
  sleep 5
done
echo "Connected to postgres. Running setup script..."
cat /scripts/setup_appflowy_db.sql
psql \
  -v ON_ERROR_STOP=1 \
  -U {{ .Values.global.database.adminUsername }} \
  -h {{ .Values.global.database.host }} \
  -p {{ .Values.global.database.port }} \
  -d {{ .Values.global.database.name }} \
  -f /scripts/setup_appflowy_db.sql
{{- end }}
