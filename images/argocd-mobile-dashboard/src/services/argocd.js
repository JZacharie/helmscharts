
const ARGOCD_SERVER = import.meta.env.VITE_ARGOCD_SERVER || '';
const ARGOCD_TOKEN = import.meta.env.VITE_ARGOCD_TOKEN || '';

export async function fetchApplications() {
    // If no server is configured, return mock data for development/demo
    if (!ARGOCD_SERVER && import.meta.env.DEV) {
        console.warn('No VITE_ARGOCD_SERVER set, using mock data');
        const mockApps = await import('../../mock-data.json');
        return mockApps.default;
    }

    try {
        const response = await fetch(`${ARGOCD_SERVER}/api/v1/applications`, {
            headers: {
                'Authorization': `Bearer ${ARGOCD_TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error(`ArgoCD API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.items || [];
    } catch (error) {
        console.error("Failed to fetch applications", error);
        throw error;
    }
}
