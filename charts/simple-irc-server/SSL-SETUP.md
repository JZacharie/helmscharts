# IRC Server SSL/TLS Setup

## Génération du certificat SSL

### Option 1: Certificat auto-signé (développement/test)

```bash
# Créer un certificat auto-signé
openssl req -x509 -newkey rsa:4096 -nodes \
  -keyout tls.key \
  -out tls.crt \
  -days 365 \
  -subj "/CN=irc.zacharie.org"

# Créer le secret Kubernetes
kubectl create secret tls irc-tls-cert \
  --cert=tls.crt \
  --key=tls.key \
  -n default
```

### Option 2: Let's Encrypt avec cert-manager (production)

```bash
# Installer cert-manager si pas déjà fait
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Créer un ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@zacharie.org
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF

# Créer le Certificate
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: irc-tls-cert
  namespace: default
spec:
  secretName: irc-tls-cert
  issuerRef:
    name: letsencrypt-prod
    kind: ClusterIssuer
  dnsNames:
  - irc.zacharie.org
EOF
```

## Configuration du chart

Dans `values.yaml`, le SSL est déjà configuré :

```yaml
service:
  type: LoadBalancer
  port: 6667      # IRC standard
  sslPort: 6697   # IRCS (IRC over SSL)
  enableSSL: true

ssl:
  enabled: true
  secretName: "irc-tls-cert"
```

## Connexion des clients

### Port 6667 (non chiffré)
```
/server irc.zacharie.org 6667
```

### Port 6697 (SSL/TLS)
```
/server irc.zacharie.org +6697
```

Le `+` indique au client IRC d'utiliser SSL/TLS.

## Vérification

```bash
# Vérifier que le service expose les deux ports
kubectl get svc

# Tester la connexion SSL
openssl s_client -connect irc.zacharie.org:6697
```
