# Add case.beeaa.com zone to Cloudflare
# Uses .NET HttpClient to avoid PowerShell cmdlet OOM on error responses

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http

# Read token (no echo)
$credFile = 'F:\MiniMaxFile\beeaa_File\_secrets\CREDENTIALS.txt'
$token = ((Get-Content $credFile | Select-String -Pattern '^CF_API_TOKEN_BEEAA=') -replace '^CF_API_TOKEN_BEEAA=','').Trim()

if ([string]::IsNullOrEmpty($token)) {
    Write-Output "ERROR: token empty"
    exit 1
}

$client = New-Object System.Net.Http.HttpClient
$client.Timeout = [TimeSpan]::FromSeconds(30)
$client.DefaultRequestHeaders.Add('Authorization', "Bearer $token")

function Call-Cf {
    param(
        [string]$Method,
        [string]$Url,
        [string]$BodyJson = $null
    )
    $req = New-Object System.Net.Http.HttpRequestMessage(
        [System.Net.Http.HttpMethod]::Parse($Method),
        [Uri]$Url
    )
    if ($BodyJson) {
        $req.Content = New-Object System.Net.Http.StringContent(
            $BodyJson,
            [System.Text.Encoding]::UTF8,
            'application/json'
        )
    }
    $resp = $client.SendAsync($req).GetAwaiter().GetResult()
    $code = [int]$resp.StatusCode
    $jsonText = $resp.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    $obj = $null
    if (-not [string]::IsNullOrEmpty($jsonText)) {
        try { $obj = $jsonText | ConvertFrom-Json } catch {}
    }
    [pscustomobject]@{
        Code = $code
        Body = $obj
        Raw = $jsonText
    }
}

# === Step 1: Verify token ===
Write-Output "=== STEP 1: Verify token (GET /user) ==="
$r1 = Call-Cf -Method 'GET' -Url 'https://api.cloudflare.com/client/v4/user'
Write-Output ("HTTP: " + $r1.Code)
if ($r1.Body -and $r1.Body.success) {
    Write-Output ("User:  " + $r1.Body.result.email)
    Write-Output ("Acct:  " + $r1.Body.result.id)
} else {
    Write-Output "Token INVALID or insufficient scope."
    if ($r1.Body -and $r1.Body.errors) {
        Write-Output ("Err1:  " + $r1.Body.errors[0].message)
    }
    $client.Dispose()
    exit 1
}
Write-Output ""

# === Step 2: Create zone ===
Write-Output "=== STEP 2: Create zone (POST /zones) ==="
$r2 = Call-Cf -Method 'POST' -Url 'https://api.cloudflare.com/client/v4/zones' -BodyJson '{"name":"case.beeaa.com","type":"full"}'
Write-Output ("HTTP: " + $r2.Code)
if ($r2.Body -and $r2.Body.success) {
    Write-Output ("Zone:  " + $r2.Body.result.name)
    Write-Output ("ID:    " + $r2.Body.result.id)
    Write-Output ("Status:" + $r2.Body.result.status)
    Write-Output "Name Servers:"
    $r2.Body.result.name_servers | ForEach-Object { Write-Output ("  " + $_) }
} else {
    Write-Output "Zone creation FAILED."
    if ($r2.Body -and $r2.Body.errors) {
        Write-Output ("Err1:  " + $r2.Body.errors[0].message)
        if ($r2.Body.errors[0].code) { Write-Output ("Code:  " + $r2.Body.errors[0].code) }
    } else {
        Write-Output ("Raw:   " + ($r2.Raw.Substring(0, [Math]::Min(300, $r2.Raw.Length))))
    }
}

$client.Dispose()
$token = $null
[System.GC]::Collect() | Out-Null
