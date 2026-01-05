# Kasm Workspaces Deployment avec Vault et ArgoCD

## Objectif

Déployer Kasm Workspaces dans Kubernetes via ArgoCD en utilisant le chart Helm officiel de kasmtech/kasm-helm, avec intégration complète de Vault pour la gestion des secrets. Aucun secret ne doit être stocké dans les fichiers Helm ou les images Docker.

## User Review Required

> [!IMPORTANT]
> **Stratégie de déploiement**: Je vais adapter le chart officiel Kasm (version 1.1181.0) pour l'intégrer dans votre repository helmscharts et ajouter l'intégration Vault. Le chart officiel déploie les composants suivants:
> - API service (kasmweb/api:1.18.1)
> - Manager service (kasmweb/manager:1.18.1)
> - PostgreSQL database (kasmweb/postgres:1.18.1)
> - Proxy service (kasmweb/proxy:1.18.1)
> - Guacamole connection proxy (kasmweb/kasm-guac:1.18.1)
> - RDP Gateway (kasmweb/rdp-gateway:1.18.1)
> - RDP HTTPS Gateway (kasmweb/rdp-https-gateway:1.18.1)

> [!WARNING]
> **Kasm Agent non inclus**: Le chart Helm officiel ne déploie PAS le Kasm Agent qui est responsable du provisionnement des conteneurs de sessions utilisateur. L'agent doit être installé séparément sur des VMs ou serveurs bare-metal. Voulez-vous que je configure également l'agent ou seulement les services core?

> [!IMPORTANT]
> **Secrets Vault requis**: Les secrets suivants devront être créés dans Vault à `vault.p.zacharie.org`:
> - `kasm/admin-password` - Mot de passe administrateur Kasm
> - `kasm/user-password` - Mot de passe utilisateur par défaut
> - `kasm/database-password` - Mot de passe PostgreSQL
> - `kasm/redis-password` - Mot de passe Redis
> - `kasm/manager-token` - Token pour le service Manager

## Proposed Changes

### helmscharts Repository

#### [NEW] [Chart.yaml](file:///home/joseph/git/helmscharts/charts/kasm/Chart.yaml)

Créer le fichier Chart.yaml basé sur le chart officiel avec les métadonnées appropriées.

#### [NEW] [values.yaml](file:///home/joseph/git/helmscharts/charts/kasm/values.yaml)

Copier et adapter le values.yaml officiel avec:
- Configuration des images Docker officielles kasmweb
- Désactivation des secrets inline
- Configuration Ingress pour votre domaine
- Paramètres de ressources appropriés
- Configuration Vault

#### [NEW] [templates/_helpers.tpl](file:///home/joseph/git/helmscharts/charts/kasm/templates/_helpers.tpl)

Copier le fichier helpers du chart officiel et ajouter les helpers pour Vault.

#### [NEW] [templates/vault.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/vault.yaml)

Créer l'intégration Vault avec:
- SecretStore pointant vers `vault.p.zacharie.org` avec le token `YOUR_VAULT_TOKEN`
- ExternalSecret pour les credentials admin/user
- ExternalSecret pour les credentials database
- ExternalSecret pour les credentials Redis
- ExternalSecret pour le manager token

#### [NEW] [templates/api-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/api-deployment.yaml)

Copier depuis le chart officiel et modifier pour utiliser les secrets Vault au lieu des secrets inline.

#### [NEW] [templates/manager-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/manager-deployment.yaml)

Copier depuis le chart officiel et modifier pour utiliser les secrets Vault.

#### [NEW] [templates/db-statefulset.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/db-statefulset.yaml)

Copier depuis le chart officiel et modifier pour utiliser les secrets Vault pour PostgreSQL.

#### [NEW] [templates/guac-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/guac-deployment.yaml)

Copier depuis le chart officiel.

#### [NEW] [templates/proxy-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/proxy-deployment.yaml)

Copier depuis le chart officiel.

#### [NEW] [templates/rdp-gateway-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/rdp-gateway-deployment.yaml)

Copier depuis le chart officiel (si enabled).

#### [NEW] [templates/rdp-https-gateway-deployment.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/rdp-https-gateway-deployment.yaml)

Copier depuis le chart officiel (si enabled).

#### [NEW] [templates/*-service.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/)

Copier tous les fichiers de services depuis le chart officiel.

#### [NEW] [templates/ingress.yaml](file:///home/joseph/git/helmscharts/charts/kasm/templates/ingress.yaml)

Copier et adapter pour votre configuration Ingress.

#### [MODIFY] [kasm-0.1.0.tgz](file:///home/joseph/git/helmscharts/kasm-0.1.0.tgz)

Package du nouveau chart Kasm.

#### [MODIFY] [index.yaml](file:///home/joseph/git/helmscharts/index.yaml)

Ajouter l'entrée pour le chart Kasm dans l'index Helm.

---

### jo3 Repository (ArgoCD Configuration)

#### [NEW] [kasm.yaml](file:///home/joseph/git/jo3/Applications/productivity/kasm.yaml)

Créer l'Application ArgoCD pour Kasm Workspaces:
- Source: helmscharts repository
- Chart: kasm
- Destination: namespace kasm
- Sync policy avec auto-sync
- Health checks appropriés

#### [NEW] [values.yaml](file:///home/joseph/git/jo3/values/productivity/kasm/values.yaml)

Créer le fichier de valeurs pour l'environnement avec:
- Configuration Ingress (hostname, TLS)
- Configuration Vault (enabled, paths)
- Taille de déploiement
- Configuration des ressources
- Désactivation des composants optionnels si nécessaire

## Verification Plan

### Automated Tests

```bash
# 1. Vérifier que le chart Helm est valide
cd /home/joseph/git/helmscharts/charts/kasm
helm lint .

# 2. Vérifier le template rendering
helm template kasm . --values /home/joseph/git/jo3/values/productivity/kasm/values.yaml --debug

# 3. Vérifier que tous les secrets référencent Vault et non des valeurs inline
helm template kasm . --values /home/joseph/git/jo3/values/productivity/kasm/values.yaml | grep -i "stringData:" || echo "OK: No inline secrets found"
```

### Manual Verification

1. **Vérifier le sync ArgoCD**:
   - Aller sur l'interface ArgoCD
   - Vérifier que l'application `kasm` apparaît
   - Vérifier le statut Sync = "Synced"
   - Vérifier le statut Health = "Healthy"

2. **Vérifier les pods**:
   ```bash
   kubectl get pods -n kasm
   ```
   - Tous les pods doivent être en état "Running"
   - Vérifier: kasm-api, kasm-manager, kasm-db, kasm-proxy, kasm-guac

3. **Vérifier les secrets Vault**:
   ```bash
   kubectl get secretstore -n kasm
   kubectl get externalsecret -n kasm
   kubectl describe externalsecret -n kasm
   ```
   - SecretStore doit être "Valid"
   - ExternalSecrets doivent être "SecretSynced"

4. **Tester l'accès web**:
   - Accéder à l'URL configurée dans Ingress
   - Vérifier que la page de login Kasm s'affiche
   - Tenter une connexion avec les credentials stockés dans Vault

5. **Vérifier les logs**:
   ```bash
   kubectl logs -n kasm deployment/kasm-api --tail=50
   kubectl logs -n kasm deployment/kasm-manager --tail=50
   kubectl logs -n kasm statefulset/kasm-db --tail=50
   ```
   - Pas d'erreurs critiques
   - Connexion à la base de données réussie
   - Services démarrés correctement
