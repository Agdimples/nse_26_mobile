# Generates every piece of My Conference Companion branding artwork from one
# source: the official NSE crest.
#
# This deliberately does NOT invent a design. The crest in
# assets/nse-crest-512.png is the official NSE mark (fetched from
# nse.org.ng/wp-content/uploads/2024/11/icon-1.png); this script only places it
# on the NSE navy and sizes it for each target.
#
# The source has a stray opaque fragment near its bottom-left edge that is
# separate from the emblem. A connected-component pass strips anything that sits
# entirely in the bottom 8% of the image and is tiny compared to the main mark,
# so the crest can be re-centred without the blemish.
#
# Outputs:
#   public/icons/icon-192.png                 web manifest "any"
#   public/icons/icon-512.png                 web manifest "any"
#   public/icons/icon-maskable-512.png        web manifest "maskable"
#   public/icons/icon-1024.png                high-res master
#   store/play-icon-512.png                   Play listing app icon (512x512)
#   store/play-feature-graphic-1024x500.png   Play listing feature graphic
#   android/app/src/main/res/mipmap-*/ic_launcher.png            legacy launcher icon
#   android/app/src/main/res/mipmap-*/ic_launcher_foreground.png adaptive foreground
#
# Run: powershell -ExecutionPolicy Bypass -File tool/gen_brand_artwork.ps1
# (Uses if/else, not ternaries - Windows PowerShell 5.1 has no ? operator.)
Add-Type -AssemblyName System.Drawing

$repoRoot = Join-Path $PSScriptRoot ".."
$crestPath = Join-Path $repoRoot "assets\nse-crest-512.png"
$iconDir = Join-Path $repoRoot "public\icons"
$storeDir = Join-Path $repoRoot "store"
$androidRes = Join-Path $repoRoot "android\app\src\main\res"

if (-not (Test-Path $crestPath)) {
  Write-Error "Missing crest source: $crestPath"
  exit 1
}

New-Item -ItemType Directory -Force -Path $iconDir, $storeDir | Out-Null

# Official NSE palette (see src/lib/event-config.ts and styles.css).
$navy = [System.Drawing.Color]::FromArgb(255, 18, 62, 115)
$navyDeep = [System.Drawing.Color]::FromArgb(255, 8, 40, 78)
$gold = [System.Drawing.Color]::FromArgb(255, 201, 162, 39)
$paper = [System.Drawing.Color]::FromArgb(255, 251, 247, 239)

$appName = "My Conference Companion"

# --- Crest preparation ------------------------------------------------------
# Removes stray blobs, then crops to the emblem so it can be centred exactly.
function Get-PreparedCrest([string]$path, [int]$alphaThreshold) {
  $src = [System.Drawing.Bitmap]::FromFile($path)
  $w = $src.Width
  $h = $src.Height
  $n = $w * $h

  $mask = New-Object 'bool[]' $n
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $mask[$y * $w + $x] = ($src.GetPixel($x, $y).A -gt $alphaThreshold)
    }
  }

  # 4-connected component labelling, iteratively (no recursion - 262k pixels).
  $labels = New-Object 'int[]' $n
  $found = New-Object System.Collections.ArrayList
  $current = 0

  for ($i = 0; $i -lt $n; $i++) {
    if (-not $mask[$i] -or $labels[$i] -ne 0) { continue }
    $current++
    $labels[$i] = $current
    $queue = New-Object 'System.Collections.Generic.Queue[int]'
    $queue.Enqueue($i)
    $area = 0
    $minY = $h
    $maxY = -1
    $minX = $w
    $maxX = -1
    while ($queue.Count -gt 0) {
      $p = $queue.Dequeue()
      $area++
      $py = [int][Math]::Floor($p / $w)
      $px = $p - ($py * $w)
      if ($py -lt $minY) { $minY = $py }
      if ($py -gt $maxY) { $maxY = $py }
      if ($px -lt $minX) { $minX = $px }
      if ($px -gt $maxX) { $maxX = $px }
      if ($px -gt 0 -and $mask[$p - 1] -and $labels[$p - 1] -eq 0) { $labels[$p - 1] = $current; $queue.Enqueue($p - 1) }
      if ($px -lt ($w - 1) -and $mask[$p + 1] -and $labels[$p + 1] -eq 0) { $labels[$p + 1] = $current; $queue.Enqueue($p + 1) }
      if ($py -gt 0 -and $mask[$p - $w] -and $labels[$p - $w] -eq 0) { $labels[$p - $w] = $current; $queue.Enqueue($p - $w) }
      if ($py -lt ($h - 1) -and $mask[$p + $w] -and $labels[$p + $w] -eq 0) { $labels[$p + $w] = $current; $queue.Enqueue($p + $w) }
    }
    [void]$found.Add([pscustomobject]@{
        Id = $current; Area = $area; MinX = $minX; MaxX = $maxX; MinY = $minY; MaxY = $maxY
      })
  }

  $largest = ($found | Sort-Object -Property Area -Descending)[0]
  $bottomBandStart = [int]($h * 0.92)
  $areaFloor = [int]($largest.Area * 0.25)

  $drop = New-Object System.Collections.ArrayList
  foreach ($c in $found) {
    if ($c.Id -eq $largest.Id) { continue }
    # Only discard small fragments that live entirely in the bottom band.
    if ($c.MinY -ge $bottomBandStart -and $c.Area -lt $areaFloor) {
      [void]$drop.Add($c)
    }
  }

  Write-Host ("crest components: {0}; largest {1}px; discarded {2} bottom fragment(s) totalling {3}px" -f `
      $found.Count, $largest.Area, $drop.Count, (($drop | Measure-Object -Property Area -Sum).Sum))
  foreach ($c in $drop) {
    Write-Host ("  discarded: id={0} area={1} x {2}..{3} y {4}..{5}" -f $c.Id, $c.Area, $c.MinX, $c.MaxX, $c.MinY, $c.MaxY)
  }

  # Build the cleaned bitmap: zero the alpha of every discarded component.
  $cleaned = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      $label = $labels[$y * $w + $x]
      $c = $src.GetPixel($x, $y)
      $keep = $true
      if ($label -ne 0) {
        foreach ($d in $drop) { if ($d.Id -eq $label) { $keep = $false; break } }
      }
      if ($keep) {
        $cleaned.SetPixel($x, $y, $c)
      } else {
        $cleaned.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
  $src.Dispose()

  # Bounding box of what survived, so the emblem can be centred precisely.
  $x0 = $w; $y0 = $h; $x1 = -1; $y1 = -1
  for ($y = 0; $y -lt $h; $y++) {
    for ($x = 0; $x -lt $w; $x++) {
      if ($cleaned.GetPixel($x, $y).A -gt $alphaThreshold) {
        if ($x -lt $x0) { $x0 = $x }
        if ($x -gt $x1) { $x1 = $x }
        if ($y -lt $y0) { $y0 = $y }
        if ($y -gt $y1) { $y1 = $y }
      }
    }
  }

  $cw = $x1 - $x0 + 1
  $ch = $y1 - $y0 + 1
  Write-Host ("crest emblem bounds: x {0}..{1} y {2}..{3}  ({4}x{5})" -f $x0, $x1, $y0, $y1, $cw, $ch)

  # Square crop centred on the emblem so scaling preserves its proportions.
  $side = [Math]::Max($cw, $ch)
  $cx = [int]($x0 + $cw / 2)
  $cy = [int]($y0 + $ch / 2)
  $cropX = $cx - [int]($side / 2)
  $cropY = $cy - [int]($side / 2)

  $out = New-Object System.Drawing.Bitmap $side, $side, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($out)
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)
  $destRect = New-Object System.Drawing.Rectangle 0, 0, $side, $side
  $srcRect = New-Object System.Drawing.Rectangle $cropX, $cropY, $side, $side
  $g.DrawImage($cleaned, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
  $g.Dispose()
  $cleaned.Dispose()

  return $out
}

function Fill-NavyGradient($g, [int]$size) {
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, $navy, $navyDeep, 135
  $g.FillRectangle($brush, 0, 0, $size, $size)
  $brush.Dispose()
}

# $fill = fraction of the square the crest occupies.
#   0.78 -> normal icon margin
#   0.60 -> inside the Android adaptive / maskable safe zone (an 80%-wide circle)
function Compose-CrestIcon($crest, [int]$size, [double]$fill, [bool]$withBackground) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.Clear([System.Drawing.Color]::Transparent)

  if ($withBackground) { Fill-NavyGradient $g $size }

  $box = [int]($size * $fill)
  $offset = [int](($size - $box) / 2)
  $g.DrawImage($crest, $offset, $offset, $box, $box)
  $g.Dispose()
  return $bmp
}

function Save-Png($bmp, $path) {
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $path) | Out-Null
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
}

$crest = Get-PreparedCrest $crestPath 24

# --- Web / PWA icons -------------------------------------------------------
$master = Compose-CrestIcon $crest 1024 0.78 $true
Save-Png (Compose-CrestIcon $crest 192 0.78 $true) (Join-Path $iconDir "icon-192.png")
Save-Png (Compose-CrestIcon $crest 512 0.78 $true) (Join-Path $iconDir "icon-512.png")
Save-Png (Compose-CrestIcon $crest 512 0.78 $true) (Join-Path $storeDir "play-icon-512.png")
Save-Png $master (Join-Path $iconDir "icon-1024.png")
$master.Dispose()

Save-Png (Compose-CrestIcon $crest 512 0.60 $true) (Join-Path $iconDir "icon-maskable-512.png")

# --- Android launcher icons ------------------------------------------------
# Adaptive icons are a 108dp canvas with only the middle 72dp guaranteed
# visible, so the foreground uses the 0.60 safe-zone fill over the navy
# background colour declared in res/values/colors.xml.
if (Test-Path (Join-Path $repoRoot "android")) {
  $densities = @(
    @{ Name = "mdpi"; Launcher = 48; Adaptive = 108 },
    @{ Name = "hdpi"; Launcher = 72; Adaptive = 162 },
    @{ Name = "xhdpi"; Launcher = 96; Adaptive = 216 },
    @{ Name = "xxhdpi"; Launcher = 144; Adaptive = 324 },
    @{ Name = "xxxhdpi"; Launcher = 192; Adaptive = 432 }
  )
  foreach ($d in $densities) {
    $dir = Join-Path $androidRes ("mipmap-" + $d.Name)
    Save-Png (Compose-CrestIcon $crest $d.Launcher 0.78 $true) (Join-Path $dir "ic_launcher.png")
    Save-Png (Compose-CrestIcon $crest $d.Adaptive 0.60 $false) (Join-Path $dir "ic_launcher_foreground.png")
  }
  Write-Host "Android launcher icons written to $androidRes"
} else {
  Write-Host "Skipped Android launcher icons (no android/ directory)."
}

# --- Play feature graphic (1024x500, no alpha) -----------------------------
$fw = 1024
$fh = 500
$feature = New-Object System.Drawing.Bitmap $fw, $fh, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
$fg = [System.Drawing.Graphics]::FromImage($feature)
$fg.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$fg.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$fg.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$frect = New-Object System.Drawing.Rectangle 0, 0, $fw, $fh
$fbrush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $frect, $navy, $navyDeep, 20
$fg.FillRectangle($fbrush, 0, 0, $fw, $fh)
$fbrush.Dispose()

# Drawn with a transparent background so it blends into the gradient - drawing
# the finished square icon here would leave a visible navy patch.
$crestForFeature = Compose-CrestIcon $crest 512 1.0 $false
$fg.DrawImage($crestForFeature, 58, 112, 276, 276)
$crestForFeature.Dispose()

$fName = New-Object System.Drawing.Font("Segoe UI", 36, [System.Drawing.FontStyle]::Bold)
$fSub = New-Object System.Drawing.Font("Segoe UI", 15, [System.Drawing.FontStyle]::Regular)
$fSmall = New-Object System.Drawing.Font("Segoe UI", 13, [System.Drawing.FontStyle]::Regular)
$fPaper = New-Object System.Drawing.SolidBrush($paper)
$fSoft = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(205, 255, 255, 255))
$fGold = New-Object System.Drawing.SolidBrush($gold)

$fg.DrawString($appName, $fName, $fPaper, 366, 150)
$fg.DrawString("2026 International Engineering Conference,", $fSub, $fSoft, 370, 216)
$fg.DrawString("Exhibition & Annual General Meeting", $fSub, $fSoft, 370, 244)
$fg.DrawString("Maiduguri, Borno State  |  30 Nov - 4 Dec 2026", $fSmall, $fGold, 370, 284)

$fName.Dispose(); $fSub.Dispose(); $fSmall.Dispose()
$fPaper.Dispose(); $fSoft.Dispose(); $fGold.Dispose(); $fg.Dispose()
$feature.Save((Join-Path $storeDir "play-feature-graphic-1024x500.png"), [System.Drawing.Imaging.ImageFormat]::Png)
$feature.Dispose()

$crest.Dispose()

Write-Host "Web icons written to $iconDir"
Write-Host "Store artwork written to $storeDir"
