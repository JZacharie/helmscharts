{{/*
Expand the name of the chart.
*/}}
{{- define "appflowy-sbx.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "appflowy-sbx.fullname" -}}
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
Create the name of the secret to use
*/}}
{{- define "appflowy-sbx.secretName" -}}
{{- if .Values.secret -}}
{{- default (include "appflowy-sbx.fullname" .) .Values.secret.name }}
{{- else if (index .Values "global" "secret") -}}
{{- default (include "appflowy-sbx.fullname" .) (index .Values "global" "secret" "name") }}
{{- else -}}
{{- printf "%s-secret" (include "appflowy-sbx.fullname" .) }}
{{- end -}}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "appflowy-sbx.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "appflowy-sbx.labels" -}}
helm.sh/chart: {{ include "appflowy-sbx.chart" . }}
{{ include "appflowy-sbx.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "appflowy-sbx.selectorLabels" -}}
app.kubernetes.io/name: {{ include "appflowy-sbx.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Component labels
*/}}
{{- define "appflowy-sbx.componentLabels" -}}
{{ include "appflowy-sbx.labels" . }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
Database URL for appflowy
*/}}
{{- define "appflowy-sbx.databaseUrl" -}}
{{- $db := .Values.database | default dict }}
{{- $globalDb := (index .Values "global" "database") | default dict }}
{{- $user := default $db.username $globalDb.username | default "postgres" }}
{{- $pass := default $db.password $globalDb.password | default "" }}
{{- $host := default $db.host $globalDb.host | default "localhost" }}
{{- $port := default $db.port $globalDb.port | default 5432 }}
{{- $name := default $db.name $globalDb.name | default "appflowy" }}
{{- printf "postgres://%s:%s@%s:%d/%s" $user $pass $host ($port | int) $name }}
{{- end }}

{{/*
Database URL for gotrue with search_path
*/}}
{{- define "appflowy-sbx.gotrueDatabaseUrl" -}}
{{- $db := .Values.database | default dict }}
{{- $globalDb := (index .Values "global" "database") | default dict }}
{{- $user := default $db.username $globalDb.username | default "postgres" }}
{{- $pass := default $db.password $globalDb.password | default "" }}
{{- $host := default $db.host $globalDb.host | default "localhost" }}
{{- $port := default $db.port $globalDb.port | default 5432 }}
{{- $name := default $db.name $globalDb.name | default "appflowy" }}
{{- printf "postgres://%s:%s@%s:%d/%s?search_path=auth" $user $pass $host ($port | int) $name }}
{{- end }}

{{/*
GoTrue base URL (internal)
*/}}
{{- define "appflowy-sbx.gotrueInternalUrl" -}}
{{- printf "http://%s-gotrue:9999" (include "appflowy-sbx.fullname" .) }}
{{- end }}

{{/*
AppFlowy Cloud base URL (internal)
*/}}
{{- define "appflowy-sbx.cloudInternalUrl" -}}
{{- printf "http://%s-cloud:8000" (include "appflowy-sbx.fullname" .) }}
{{- end }}

{{/*
Redis URL
*/}}
{{- define "appflowy-sbx.redisUrl" -}}
{{- default .Values.redis.uri (index .Values "global" "redis" "uri" | default "") }}
{{- end }}

{{/*
S3/MinIO URL
*/}}
{{- define "appflowy-sbx.minioUrl" -}}
{{- .Values.s3.url }}
{{- end }}

{{/*
Node selector
*/}}
{{- define "appflowy-sbx.nodeSelector" -}}
{{- if .Values.nodeSelector }}
nodeSelector:
  {{- toYaml .Values.nodeSelector | nindent 2 }}
{{- end }}
{{- end }}
