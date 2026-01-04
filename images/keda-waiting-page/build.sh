#!/bin/bash
set -e

# Configuration
IMAGE_NAME="registry.p.zacharie.org/keda-waiting-page"
IMAGE_TAG="${1:-latest}"
FULL_IMAGE="${IMAGE_NAME}:${IMAGE_TAG}"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Building KEDA Waiting Page Docker image...${NC}"
echo "Image: ${FULL_IMAGE}"

# Navigate to the app directory
cd "$(dirname "$0")"

# Build the image
echo -e "${BLUE}Building Docker image...${NC}"
docker build -t "${FULL_IMAGE}" .

# Push the image
echo -e "${BLUE}Pushing Docker image to registry...${NC}"
docker push "${FULL_IMAGE}"

echo -e "${GREEN}✓ Successfully built and pushed ${FULL_IMAGE}${NC}"

# Optional: Restart deployment to pick up new image
if [ "$2" == "--restart" ]; then
    echo -e "${BLUE}Restarting deployment...${NC}"
    kubectl rollout restart deployment/keda-waiting-page -n keda
    echo -e "${GREEN}✓ Deployment restarted${NC}"
fi

echo ""
echo "To deploy or update the application:"
echo "  kubectl apply -f ../../Applications/infrastructure/keda-waiting-page.yaml"
echo ""
echo "To manually restart the deployment:"
echo "  kubectl rollout restart deployment/keda-waiting-page -n keda"
