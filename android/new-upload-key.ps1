# Creates the Google Play *upload* keystore for My Conference Companion.
#
# Google Play App Signing re-signs the uploaded bundle with an app signing key
# that Google holds; this upload key only proves an upload came from you. It
# still has to stay secret and be backed up: if you lose it you must ask Google
# for an upload-key reset before you can publish an update.
#
# Writes, both git-ignored (see android/.gitignore):
#   android/keystore/nse-upload.keystore
#   android/keystore.properties
#
# Run once: powershell -ExecutionPolicy Bypass -File android/new-upload-key.ps1
param(
  [string]$Alias = "upload",
  [string]$DistinguishedName = "CN=Orivon Edge, OU=My Conference Companion, O=Orivon Edge Ltd, L=Maiduguri, ST=Borno, C=NG"
)

$ErrorActionPreference = "Stop"

$androidDir = $PSScriptRoot
$keystoreDir = Join-Path $androidDir "keystore"
$keystorePath = Join-Path $keystoreDir "nse-upload.keystore"
$propertiesPath = Join-Path $androidDir "keystore.properties"

if (Test-Path $keystorePath) {
  throw "$keystorePath already exists. Delete it deliberately if you really mean to rotate the upload key."
}

New-Item -ItemType Directory -Force -Path $keystoreDir | Out-Null

# 32 characters from a full alphanumeric alphabet.
$alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".ToCharArray()
$password = -join (1..32 | ForEach-Object { $alphabet | Get-Random })

$keytool = $null
if ($env:JAVA_HOME) {
  $candidate = Join-Path $env:JAVA_HOME "bin\keytool.exe"
  if (Test-Path $candidate) { $keytool = $candidate }
}
if (-not $keytool) {
  $candidate = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
  if (Test-Path $candidate) { $keytool = $candidate }
}
if (-not $keytool) {
  throw "keytool.exe not found. Set JAVA_HOME to a JDK (Android Studio's jbr works)."
}

& $keytool -genkeypair -v `
  -keystore $keystorePath `
  -storetype PKCS12 `
  -alias $Alias `
  -keyalg RSA -keysize 4096 -validity 10000 `
  -storepass $password `
  -keypass $password `
  -dname $DistinguishedName

if ($LASTEXITCODE -ne 0) { throw "keytool failed with exit code $LASTEXITCODE" }

Set-Content -Path $propertiesPath -Encoding ASCII -Value (@(
  "storeFile=keystore/nse-upload.keystore",
  "storePassword=$password",
  "keyAlias=$Alias",
  "keyPassword=$password"
) -join "`n")

# Print the fingerprint that belongs in assetlinks.json - never the password.
& $keytool -list -v -keystore $keystorePath -storepass $password -alias $Alias |
  Select-String "SHA256:"

Write-Host ""
Write-Host "Upload keystore : $keystorePath"
Write-Host "Credentials     : $propertiesPath"
Write-Host "Back both up somewhere safe - they are git-ignored and are NOT in GitHub."
