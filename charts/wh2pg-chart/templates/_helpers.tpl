{{/*
Expand the name of the chart.
*/}}
{{- define "wh2pg.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "wh2pg.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "wh2pg.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "wh2pg.labels" -}}
helm.sh/chart: {{ include "wh2pg.chart" . }}
{{ include "wh2pg.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "wh2pg.selectorLabels" -}}
app.kubernetes.io/name: {{ include "wh2pg.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Create the name of the service account to use
*/}}
{{- define "wh2pg.serviceAccountName" -}}
{{- if .Values.serviceAccount.create }}
{{- default (include "wh2pg.fullname" .) .Values.serviceAccount.name }}
{{- else }}
{{- default "default" .Values.serviceAccount.name }}
{{- end }}
{{- end }}

{{/*
PostgreSQL host
*/}}
{{- define "wh2pg.postgresql.host" -}}
{{- if .Values.postgresql.enabled }}
{{- printf "%s-postgresql" (include "wh2pg.fullname" .) }}
{{- else }}
{{- .Values.postgresql.external.host }}
{{- end }}
{{- end }}

{{/*
PostgreSQL port
*/}}
{{- define "wh2pg.postgresql.port" -}}
{{- if .Values.postgresql.enabled }}
{{- 5432 }}
{{- else }}
{{- .Values.postgresql.external.port }}
{{- end }}
{{- end }}

{{/*
PostgreSQL database
*/}}
{{- define "wh2pg.postgresql.database" -}}
{{- if .Values.postgresql.enabled }}
{{- "webhooks" }}
{{- else }}
{{- .Values.postgresql.external.database }}
{{- end }}
{{- end }}

{{/*
PostgreSQL username
*/}}
{{- define "wh2pg.postgresql.username" -}}
{{- if .Values.postgresql.enabled }}
{{- "webhook_user" }}
{{- else }}
{{- .Values.postgresql.external.username }}
{{- end }}
{{- end }}

{{/*
PostgreSQL secret name
*/}}
{{- define "wh2pg.postgresql.secretName" -}}
{{- if .Values.postgresql.external.existingSecret }}
{{- .Values.postgresql.external.existingSecret }}
{{- else }}
{{- include "wh2pg.fullname" . }}-postgresql
{{- end }}
{{- end }}
