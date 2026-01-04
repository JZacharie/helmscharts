# Intégration KEDA - Guide d'Utilisation

Ce document explique comment utiliser la page d'attente KEDA avec vos applications.

## Scénarios d'Utilisation

### 1. Lien Direct (Recommandé pour les Tests)

Créez un lien direct vers la page d'attente:

```
https://keda-status.p.zacharie.org/?namespace=open-webui&deployment=open-webui&name=Open%20WebUI&target=https://openwebui.p.zacharie.org
```

**Avantages:**
- Simple à tester
- Pas de configuration supplémentaire
- Idéal pour les bookmarks ou liens partagés

### 2. Middleware Traefik (Recommandé pour la Production)

Utilisez un middleware Traefik pour rediriger automatiquement vers la page d'attente quand les pods ne sont pas prêts.

#### Créer le Middleware

```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: keda-waiting-redirect
  namespace: <votre-namespace>
spec:
  plugin:
    kedaWaiting:
      statusUrl: "https://keda-status.p.zacharie.org"
```

#### Appliquer à votre Ingress

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: mon-app
  annotations:
    traefik.ingress.kubernetes.io/router.middlewares: <namespace>-keda-waiting-redirect@kubernetescrd
spec:
  # ... votre configuration Ingress
```

### 3. Script de Génération de Liens

Pour générer automatiquement des liens vers la page d'attente:

```python
#!/usr/bin/env python3
import urllib.parse

def generate_waiting_page_url(namespace, deployment, app_name, target_url):
    """Génère une URL vers la page d'attente KEDA"""
    params = {
        'namespace': namespace,
        'deployment': deployment,
        'name': app_name,
        'target': target_url
    }
    base_url = 'https://keda-status.p.zacharie.org'
    query_string = urllib.parse.urlencode(params)
    return f"{base_url}?{query_string}"

# Exemple d'utilisation
url = generate_waiting_page_url(
    namespace='open-webui',
    deployment='open-webui',
    app_name='Open WebUI',
    target_url='https://openwebui.p.zacharie.org'
)
print(url)
```

## Exemples pour vos Applications KEDA

### Open WebUI

```
https://keda-status.p.zacharie.org/?namespace=open-webui&deployment=open-webui&name=Open%20WebUI&target=https://openwebui.p.zacharie.org
```

### Devdocs

```
https://keda-status.p.zacharie.org/?namespace=devdocs&deployment=devdocs&name=DevDocs&target=https://devdocs.p.zacharie.org
```

### Code Server

```
https://keda-status.p.zacharie.org/?namespace=code-server&deployment=code-server&name=Code%20Server&target=https://code.p.zacharie.org
```

### Lobe Chat

```
https://keda-status.p.zacharie.org/?namespace=lobe-chat&deployment=lobe-chat&name=Lobe%20Chat&target=https://lobe.p.zacharie.org
```

## Intégration dans Homepage

Pour ajouter ces liens dans votre homepage, modifiez `nav.yaml`:

```yaml
- name: Open WebUI
  icon: mdi:robot
  url: https://keda-status.p.zacharie.org/?namespace=open-webui&deployment=open-webui&name=Open%20WebUI&target=https://openwebui.p.zacharie.org
  description: Interface Web pour LLM
  category: AI
```

## Personnalisation

### Modifier le Temps d'Attente Maximum

Éditez `frontend/app.js`:

```javascript
const MAX_RETRIES = 180; // 6 minutes (180 * 2s poll interval)
```

### Modifier l'Intervalle de Polling

```javascript
const POLL_INTERVAL = 2000; // 2 secondes
const LOG_POLL_INTERVAL = 3000; // 3 secondes
```

### Personnaliser le Design

Éditez `frontend/style.css` pour modifier:
- Les couleurs (variables CSS dans `:root`)
- Les animations
- Le layout responsive

## Monitoring

### Vérifier les Logs de l'API

```bash
kubectl logs -n keda -l app=keda-waiting-page -f
```

### Vérifier les Permissions

```bash
kubectl auth can-i get pods --as=system:serviceaccount:keda:keda-waiting-page -A
kubectl auth can-i get pods/log --as=system:serviceaccount:keda:keda-waiting-page -A
```

### Tester l'API Directement

```bash
# Status d'un déploiement
curl https://keda-status.p.zacharie.org/api/status/open-webui/open-webui

# Logs d'un pod
curl https://keda-status.p.zacharie.org/api/logs/open-webui/open-webui-xxx?tailLines=20

# Check ready
curl https://keda-status.p.zacharie.org/api/ready/open-webui/open-webui
```

## Dépannage

### La page ne charge pas

1. Vérifier que le déploiement existe:
   ```bash
   kubectl get deployment -n <namespace> <deployment>
   ```

2. Vérifier les logs de l'API:
   ```bash
   kubectl logs -n keda -l app=keda-waiting-page
   ```

### Les logs ne s'affichent pas

1. Vérifier que le pod existe:
   ```bash
   kubectl get pods -n <namespace>
   ```

2. Vérifier les permissions RBAC:
   ```bash
   kubectl get clusterrole keda-waiting-page-reader
   kubectl get clusterrolebinding keda-waiting-page-reader
   ```

### Timeout après 6 minutes

Cela signifie que le pod met trop de temps à démarrer. Vérifiez:

```bash
kubectl describe pod -n <namespace> <pod-name>
kubectl logs -n <namespace> <pod-name>
```

## Prochaines Étapes

1. **Déployer l'application:**
   ```bash
   cd custom-apps/keda-waiting-page
   ./build.sh latest
   kubectl apply -f ../../Applications/infrastructure/keda-waiting-page.yaml
   ```

2. **Tester avec une application KEDA:**
   - Scaler une application à 0
   - Accéder via l'URL de la page d'attente
   - Observer le démarrage en temps réel

3. **Intégrer dans vos workflows:**
   - Ajouter les liens dans votre homepage
   - Créer des bookmarks
   - Partager avec votre équipe
