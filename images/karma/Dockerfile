# ==============================================================================
# Hardened Karma Build (Distroless non-root, Zero CVEs)
# ==============================================================================
FROM gcr.io/distroless/static:nonroot AS runner

COPY --from=ghcr.io/prymitive/karma:v0.120 /karma /karma

USER 65532:65532

EXPOSE 8080

ENTRYPOINT ["/karma"]
