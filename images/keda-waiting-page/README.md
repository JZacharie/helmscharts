# KEDA Waiting Page

Une page d'attente élégante qui affiche le statut et les logs d'un pod KEDA pendant son démarrage.

## Fonctionnalités

- 🎨 Design moderne avec glassmorphism et animations fluides
- 📊 Affichage en temps réel du statut du pod
- 📝 Streaming des logs du pod
- 🔄 Redirection automatique quand le pod est prêt
- 📱 Design responsive (mobile, tablette, desktop)
- ⚡ API backend Flask avec client Kubernetes

## Architecture

- **Frontend**: HTML/CSS/JavaScript vanilla avec design premium
- **Backend**: Flask API avec client Kubernetes Python
- **Déploiement**: Nginx + Gunicorn dans un seul conteneur
- **Permissions**: ServiceAccount avec ClusterRole pour lire les pods et logs

## Utilisation

### Accès Direct

Accédez à la page d'attente avec les paramètres d'URL suivants:

```
https://keda-status.p.zacharie.org/?namespace=<namespace>&deployment=<deployment>&name=<app-name>&target=<target-url>
```

**Paramètres:**
- `namespace`: Namespace Kubernetes du déploiement
- `deployment`: Nom du déploiement
- `name`: Nom d'affichage de l'application (optionnel)
- `target`: URL de redirection quand le pod est prêt (optionnel, par défaut: origin)

**Exemple:**
```
https://keda-status.p.zacharie.org/?namespace=open-webui&deployment=open-webui&name=Open%20WebUI&target=https://openwebui.p.zacharie.org
```

### Build et Déploiement

1. **Build l'image Docker:**
   ```bash
   cd custom-apps/keda-waiting-page
   ./build.sh latest
   ```

2. **Déployer avec ArgoCD:**
   ```bash
   kubectl apply -f Applications/infrastructure/keda-waiting-page.yaml
   ```

3. **Vérifier le déploiement:**
   ```bash
   kubectl get pods -n keda -l app=keda-waiting-page
   kubectl logs -n keda -l app=keda-waiting-page
   ```

## API Endpoints

### `GET /api/status/<namespace>/<deployment>`
Retourne le statut du déploiement et de ses pods.

**Réponse:**
```json
{
  "deployment": "open-webui",
  "namespace": "open-webui",
  "replicas": 1,
  "readyReplicas": 1,
  "phase": "Running",
  "ready": true,
  "podName": "open-webui-xxx",
  "conditions": [...]
}
```

### `GET /api/logs/<namespace>/<pod>`
Retourne les logs d'un pod.

**Paramètres de requête:**
- `tailLines`: Nombre de lignes à retourner (défaut: 50)
- `sinceTime`: Timestamp ISO 8601 pour obtenir les logs depuis
- `container`: Nom du conteneur spécifique (optionnel)

**Réponse:**
```json
{
  "logs": ["log line 1", "log line 2", ...],
  "timestamp": "2026-01-03T20:00:00Z"
}
```

### `GET /api/ready/<namespace>/<deployment>`
Vérification rapide si le déploiement est prêt.

**Réponse:**
```json
{
  "ready": true,
  "readyReplicas": 1,
  "targetReplicas": 1
}
```

## Développement

### Structure du Projet

```
keda-waiting-page/
├── frontend/
│   ├── index.html      # Page HTML principale
│   ├── style.css       # Styles avec glassmorphism
│   └── app.js          # Logique JavaScript
├── backend/
│   ├── server.py       # API Flask
│   └── requirements.txt
├── Dockerfile          # Multi-stage build
└── build.sh           # Script de build
```

### Test Local

1. **Installer les dépendances:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Lancer le backend:**
   ```bash
   python server.py
   ```

3. **Servir le frontend:**
   ```bash
   cd frontend
   python -m http.server 8000
   ```

## Intégration avec KEDA

Pour intégrer cette page d'attente avec vos applications KEDA, vous pouvez:

1. **Modifier le KEDA HTTP Interceptor** pour rediriger vers la page d'attente pendant le scale-up
2. **Utiliser un middleware Traefik** pour détecter les pods non prêts et rediriger
3. **Créer un script personnalisé** qui génère des liens vers la page d'attente

## Sécurité

- ServiceAccount avec permissions minimales (lecture seule)
- ClusterRole limité aux ressources nécessaires
- Conteneur s'exécute en tant qu'utilisateur non-root (UID 1000)
- Pas d'accès en écriture aux ressources Kubernetes

## License

Propriétaire - JZacharie
