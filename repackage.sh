#!/bin/bash
set -e
cd /home/joseph/git/helmscharts

echo "Packaging charts..."
for d in charts/*; do
  if [ -d "$d" ]; then
    chart_name=$(basename "$d")
    echo "Processing $chart_name"
    
    # Check if Chart.yaml exists
    if [ -f "$d/Chart.yaml" ]; then
      # Build dependencies if Chart.yaml has dependencies
      if grep -q "dependencies:" "$d/Chart.yaml"; then
         echo "Building dependencies for $chart_name..."
         helm dependency build "$d" || echo "Warning: Dependency build failed for $chart_name"
      fi
      
      # Package the chart to the root directory
      echo "Packaging $chart_name..."
      helm package "$d" -d .
    else
      echo "Skipping $d (no Chart.yaml)"
    fi
  fi
done

echo "Updating index.yaml..."
helm repo index . --url https://jzacharie.github.io/helmscharts/

echo "Done."
