Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$projectRoot = Split-Path -Parent $PSScriptRoot
$fontDir = Join-Path $projectRoot 'public\fonts'
$logoPath = Join-Path $projectRoot 'public\marketing\brand\organyze-logo-oficial.png'
$dashboardPath = Join-Path $projectRoot 'src\assets\tour\dashboard.webp'
$outputDir = Join-Path $projectRoot 'public\marketing\instagram'
$outputPath = Join-Path $outputDir 'post-organyze-resolve-5-dores-sem-botao.png'

$regularCollection = New-Object System.Drawing.Text.PrivateFontCollection
$semiboldCollection = New-Object System.Drawing.Text.PrivateFontCollection
$boldCollection = New-Object System.Drawing.Text.PrivateFontCollection
$regularCollection.AddFontFile((Join-Path $fontDir 'Poppins-Regular.ttf'))
$semiboldCollection.AddFontFile((Join-Path $fontDir 'Poppins-SemiBold.ttf'))
$boldCollection.AddFontFile((Join-Path $fontDir 'Poppins-Bold.ttf'))

function New-Font($family, [float]$size) {
    return [System.Drawing.Font]::new($family, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
}

function Draw-Text($g, [string]$value, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [System.Drawing.StringAlignment]$alignment = [System.Drawing.StringAlignment]::Near) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = $alignment
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $g.DrawString($value, $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $w, $h), $format)
    $format.Dispose()
}

function New-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $path.AddArc($x, $y, $d, $d, 180, 90)
    $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function Open-Webp([string]$path) {
    $bitmap = New-Object System.Windows.Media.Imaging.BitmapImage
    $bitmap.BeginInit()
    $bitmap.UriSource = [Uri]$path
    $bitmap.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    $bitmap.EndInit()
    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $null = $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmap))
    $stream = New-Object System.IO.MemoryStream
    $encoder.Save($stream)
    $stream.Position = 0
    $image = [System.Drawing.Image]::FromStream($stream)
    return @{ Image = $image; Stream = $stream }
}

$background = [System.Drawing.ColorTranslator]::FromHtml('#0F1115')
$surface = [System.Drawing.ColorTranslator]::FromHtml('#1F232A')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#0D47FF')
$cyan = [System.Drawing.ColorTranslator]::FromHtml('#00D4FF')
$white = [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#E1E1E1')

$canvas = [System.Drawing.Bitmap]::new(1080, 1350)
$g = [System.Drawing.Graphics]::FromImage($canvas)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$g.Clear($background)

$surfaceBrush = [System.Drawing.SolidBrush]::new($surface)
$blueBrush = [System.Drawing.SolidBrush]::new($blue)
$cyanBrush = [System.Drawing.SolidBrush]::new($cyan)
$whiteBrush = [System.Drawing.SolidBrush]::new($white)
$mutedBrush = [System.Drawing.SolidBrush]::new($muted)
$brandFont = New-Font $semiboldCollection.Families[0] 32
$titleFont = New-Font $boldCollection.Families[0] 63
$subFont = New-Font $regularCollection.Families[0] 29
$labelFont = New-Font $semiboldCollection.Families[0] 20
$painFont = New-Font $regularCollection.Families[0] 27
$solutionFont = New-Font $semiboldCollection.Families[0] 27
$footFont = New-Font $regularCollection.Families[0] 17

$g.FillRectangle($blueBrush, 0, 0, 1080, 9)
$logo = [System.Drawing.Image]::FromFile($logoPath)
$g.DrawImage($logo, 66, 50, 72, 72)
Draw-Text $g 'ORGANYZE' $brandFont $whiteBrush 160 48 420 78

Draw-Text $g 'A ORGANYZE RESOLVE' $titleFont $whiteBrush 66 162 948 80
Draw-Text $g 'ESSAS 5 DORES.' $titleFont $cyanBrush 66 240 948 85
Draw-Text $g 'Da agenda ao site: uma rotina mais simples para seu negócio de beleza.' $subFont $mutedBrush 68 330 944 70

Draw-Text $g 'ANTES' $labelFont $mutedBrush 85 399 405 43
Draw-Text $g 'COM A ORGANYZE' $labelFont $cyanBrush 545 399 445 43

$rows = @(
    @('Horários espalhados', 'Agenda em um só lugar'),
    @('Confirmações manuais', 'Agendamento online'),
    @('Clientes esperando', 'Reservas a qualquer hora'),
    @('Falta de visão da rotina', 'Painel de gestão'),
    @('Instagram sem agenda', 'Site com botão de reserva')
)

for ($i = 0; $i -lt $rows.Count; $i++) {
    $y = 444 + $i * 87
    $rowPath = New-RoundRect 66 $y 948 76 15
    $g.FillPath($surfaceBrush, $rowPath)
    $rowPath.Dispose()
    $g.FillRectangle($blueBrush, 66, $y + 10, 6, 56)
    Draw-Text $g $rows[$i][0] $painFont $whiteBrush 85 $y 407 76
    Draw-Text $g '→' $solutionFont $cyanBrush 492 $y 50 76 ([System.Drawing.StringAlignment]::Center)
    Draw-Text $g $rows[$i][1] $solutionFont $whiteBrush 545 $y 450 76
}

$stage = New-RoundRect 66 900 948 275 21
$g.FillPath($surfaceBrush, $stage)
$opened = Open-Webp $dashboardPath
$source = $opened.Image
$crop = [System.Drawing.Rectangle]::new(250, 85, 1150, 320)
$maxW = 924; $maxH = 251
$scale = [Math]::Min($maxW / $crop.Width, $maxH / $crop.Height)
$drawW = [float]($crop.Width * $scale)
$drawH = [float]($crop.Height * $scale)
$drawX = [float](66 + (948 - $drawW) / 2)
$drawY = [float](900 + (275 - $drawH) / 2)
$state = $g.Save()
$g.SetClip($stage)
$g.DrawImage($source, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawW, $drawH), $crop, [System.Drawing.GraphicsUnit]::Pixel)
$g.Restore($state)
$stage.Dispose(); $source.Dispose(); $opened.Stream.Dispose()
Draw-Text $g 'TELA REAL DO PAINEL  ·  DADOS DEMONSTRATIVOS' $footFont $mutedBrush 68 1179 944 35

$canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)
$logo.Dispose()
$brandFont.Dispose(); $titleFont.Dispose(); $subFont.Dispose(); $labelFont.Dispose(); $painFont.Dispose(); $solutionFont.Dispose(); $footFont.Dispose()
$surfaceBrush.Dispose(); $blueBrush.Dispose(); $cyanBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose()
$g.Dispose(); $canvas.Dispose()
$regularCollection.Dispose(); $semiboldCollection.Dispose(); $boldCollection.Dispose()
Get-Item -LiteralPath $outputPath | Select-Object FullName, Length
