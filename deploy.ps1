# ============================================
# box-beeaa-site 一键部署脚本
# 前提：已安装 Git for Windows 并重新打开 PowerShell
# 用法：.\deploy.ps1 -GitHubUsername "your-name"
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$GitHubUsername,

    [string]$RepoName = "box-beeaa-site",

    [string]$Branch = "main",

    [string]$GitUserName = "FRED",

    [string]$GitUserEmail = "kexin@beeaa.com"
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  box-beeaa-site 部署脚本" -ForegroundColor Cyan
Write-Host "  GitHub: $GitHubUsername / $RepoName" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# === 1. 检查 git ===
Write-Host "[1/6] 检查 git ..." -ForegroundColor Yellow
try {
    $gitVersion = git --version
    Write-Host "  OK: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "  ERROR: git 未安装。请先装 Git for Windows: https://git-scm.com/download/win" -ForegroundColor Red
    exit 1
}
Write-Host ""

# === 2. 初始化仓库（如果还没有）===
Write-Host "[2/6] 初始化 Git 仓库 ..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    git init
    git checkout -b $Branch
    Write-Host "  OK: 新建仓库 + 切到 $Branch 分支" -ForegroundColor Green
} else {
    Write-Host "  OK: 已存在 .git，跳过 init" -ForegroundColor Green
}
git config user.name $GitUserName
git config user.email $GitUserEmail
Write-Host ""

# === 3. 验证关键文件 ===
Write-Host "[3/6] 验证关键文件存在 ..." -ForegroundColor Yellow
$required = @(
    ".github\workflows\deploy.yml",
    ".gitignore",
    "package.json",
    "src\lib\site.config.js",
    "scripts\generate.mjs",
    "scripts\generate_extras.mjs",
    "data\keywords.json",
    "public\images\real\hero\hero02-1600w.webp"
)
$missing = @()
foreach ($f in $required) {
    if (-not (Test-Path $f)) { $missing += $f }
}
if ($missing.Count -gt 0) {
    Write-Host "  ERROR: 以下文件缺失：" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "    - $_" -ForegroundColor Red }
    exit 1
}
Write-Host "  OK: 所有关键文件齐全" -ForegroundColor Green
Write-Host ""

# === 4. 添加并提交 ===
Write-Host "[4/6] 添加并提交代码 ..." -ForegroundColor Yellow
git add .
$status = git status --short
if ($status) {
    Write-Host "  待提交文件数: $(($status | Measure-Object).Count)" -ForegroundColor Gray
    git commit -m "Initial commit: box-beeaa-site V3 architecture

- 31,758 keywords with KOS 4-dim scoring (S/A/B/C)
- 540 Tier 1 head term guides (Article Schema + E-E-A-T)
- 26,308 Tier 2 mid-tail pages (index,follow)
- 36,876 Tier 3 long-tail pages (noindex,follow)
- 8 entity graph pages + 5 tool pages + about page
- 11 Schema types: Organization, Product, FAQ, Article, Dataset, HowTo, WebApplication, DefinedTerm, etc.
- AI content variation: first-person + subjective + unpublished data
- Cloudflare Pages ready"
    Write-Host "  OK: 已提交" -ForegroundColor Green
} else {
    Write-Host "  OK: 没有新改动" -ForegroundColor Green
}
Write-Host ""

# === 5. 连接远程 + 推送 ===
Write-Host "[5/6] 连接 GitHub 远程仓库 ..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/$GitHubUsername/$RepoName.git"
$existingRemote = git remote get-url origin 2>$null
if ($existingRemote) {
    Write-Host "  现有 origin: $existingRemote" -ForegroundColor Gray
    if ($existingRemote -ne $remoteUrl) {
        git remote set-url origin $remoteUrl
        Write-Host "  OK: 已更新 origin -> $remoteUrl" -ForegroundColor Green
    }
} else {
    git remote add origin $remoteUrl
    Write-Host "  OK: 已添加 origin -> $remoteUrl" -ForegroundColor Green
}
Write-Host ""
Write-Host "  即将推送到: $remoteUrl ($Branch 分支)" -ForegroundColor Cyan
Write-Host "  ⚠️  请确保 GitHub 上已建好空仓库 $RepoName（不要 add README）" -ForegroundColor Yellow
Write-Host ""

# 验证 GitHub 仓库是否存在（用 GitHub API，无需 token 也能匿名查）
Write-Host "  正在验证 GitHub 仓库是否已创建 ..." -ForegroundColor Gray
try {
    $response = Invoke-WebRequest -Uri "https://api.github.com/repos/$GitHubUsername/$RepoName" -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  OK: GitHub 仓库已存在" -ForegroundColor Green
    } else {
        Write-Host "  WARN: 仓库不存在或无访问权限（StatusCode=$($response.StatusCode)）" -ForegroundColor Yellow
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-Host "  ERROR: GitHub 仓库不存在！" -ForegroundColor Red
        Write-Host "  请先去 https://github.com/new 创建空仓库 $RepoName" -ForegroundColor Red
        Write-Host "  勾选 Private，**不要**勾选 Add a README file" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "  WARN: 无法验证仓库（可能是网络问题），继续尝试推送 ..." -ForegroundColor Yellow
    }
}
Write-Host ""

Write-Host "  推送代码到 GitHub（可能需要输入 GitHub 凭据）..." -ForegroundColor Cyan
git push -u origin $Branch
if ($LASTEXITCODE -eq 0) {
    Write-Host "  OK: 推送成功！" -ForegroundColor Green
} else {
    Write-Host "  ERROR: 推送失败。请检查 GitHub 凭据或网络。" -ForegroundColor Red
    exit 1
}
Write-Host ""

# === 6. 下一步指引 ===
Write-Host "[6/6] 完成！" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  下一步：去 Cloudflare Pages 接入 GitHub" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. 打开 https://dash.cloudflare.com" -ForegroundColor White
Write-Host "  2. Workers & Pages → Create application → Pages → Connect to Git" -ForegroundColor White
Write-Host "  3. 选择 GitHub → 授权 → 选 $GitHubUsername/$RepoName 仓库" -ForegroundColor White
Write-Host "  4. Project name: $RepoName" -ForegroundColor White
Write-Host "  5. Build settings:" -ForegroundColor White
Write-Host "     - Framework preset: None" -ForegroundColor White
Write-Host "     - Build command:    node scripts/generate.mjs && node scripts/generate_extras.mjs" -ForegroundColor White
Write-Host "     - Build output:     dist" -ForegroundColor White
Write-Host "     - Root directory:   /" -ForegroundColor White
Write-Host "  6. Environment variables (Production):" -ForegroundColor White
Write-Host "     - NODE_VERSION = 22" -ForegroundColor White
Write-Host "  7. 点 Save and Deploy" -ForegroundColor White
Write-Host "  8. 等待 3-5 分钟构建完成（GitHub Actions 会先跑一遍）" -ForegroundColor White
Write-Host "  9. 绑域名: Custom domains → box.beeaa.com" -ForegroundColor White
Write-Host ""
Write-Host "  ⚠️  Cloudflare 两种构建方式选一种：" -ForegroundColor Yellow
Write-Host "     A. Cloudflare 直连 Git（推荐）→ build 用 Cloudflare 自己的 runner" -ForegroundColor Yellow
Write-Host "     B. Cloudflare 用 GitHub Actions → 需配 Cloudflare API token 较复杂" -ForegroundColor Yellow
Write-Host ""
Write-Host "  建议选 A，最省事。" -ForegroundColor Green
Write-Host ""
