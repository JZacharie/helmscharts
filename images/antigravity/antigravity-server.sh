#!/bin/bash
PORT=8080
for arg in "$@"; do
    if [[ "$prev" == "--port" ]]; then PORT="$arg"; fi
    if [[ "$prev" == "--bind-addr" && "$arg" == *":"* ]]; then PORT="${arg##*:}"; fi
    prev="$arg"
done

echo "Starting Mock Antigravity Server on port $PORT..."
mkdir -p /opt/antigravity/web
cat << 'HTML' > /opt/antigravity/web/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Antigravity IDE</title>
    <style>
        body { background: #0d1117; color: #c9d1d9; font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .container { text-align: center; padding: 2rem; background: #161b22; border-radius: 8px; border: 1px solid #30363d; box-shadow: 0 8px 24px rgba(0,0,0,0.2); }
        h1 { background: linear-gradient(to right, #58a6ff, #79c0ff); -webkit-background-clip: text; color: transparent; font-size: 3em; margin-bottom: 0.2em; }
        p { font-size: 1.2em; color: #8b949e; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Antigravity IDE</h1>
        <p>Coming Soon: State-of-the-art Agentic coding environment.</p>
    </div>
</body>
</html>
HTML

if command -v bun >/dev/null 2>&1; then
    exec bun -e "const port = $PORT; console.log('Listening on ' + port); Bun.serve({port, fetch(req) { return new Response(Bun.file('/opt/antigravity/web/index.html'), {headers: {'Content-Type': 'text/html'}}); }})"
else
    cd /opt/antigravity/web && exec python3 -m http.server $PORT
fi
