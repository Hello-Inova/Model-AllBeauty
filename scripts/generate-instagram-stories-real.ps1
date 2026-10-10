Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetDir = Join-Path $projectRoot 'src\assets\tour'
$fontDir = Join-Path $projectRoot 'public\fonts'
$logoPath = Join-Path $projectRoot 'public\marketing\brand\organyze-logo-oficial.png'
$outputDir = Join-Path $projectRoot 'public\marketing\instagram\stories-hello-inova-2026-09-16'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

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
    $format.Trimming = [System.Drawing.StringTrimming]::None
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

$slides = @(
    @{
        File = '01-agenda-e-mensagens.png'
        Kicker = '01 / 03  ·  SUA ROTINA'
        Head = @('SUA AGENDA', 'AINDA DEPENDE', 'DE MENSAGENS?')
        AccentLine = 2
        Body = 'Enquanto você atende, novos pedidos de horário continuam chegando.'
        Screenshot = 'agenda.webp'
        Crop = [System.Drawing.Rectangle]::new(0, 0, 1400, 620)
        Cta = 'TOQUE PARA CONTINUAR  →'
        Subcta = ''
    },
    @{
        File = '02-agendamento-online.png'
        Kicker = '02 / 03  ·  A SOLUÇÃO'
        Head = @('SEU CLIENTE', 'PODE ESCOLHER', 'O HORÁRIO.')
        AccentLine = 2
        Body = 'O agendamento online mostra os horários disponíveis a qualquer hora.'
        Screenshot = 'agendamento.webp'
        Crop = [System.Drawing.Rectangle]::new(265, 65, 815, 740)
        Cta = 'VEJA O RESULTADO  →'
        Subcta = ''
    },
    @{
        File = '03-site-que-agenda.png'
        Kicker = '03 / 03  ·  CONHEÇA A ORGANYZE'
        Head = @('SEU NEGÓCIO', 'MERECE UM SITE', 'QUE AGENDA.')
        AccentLine = 2
        Body = 'Apresente seus serviços e leve o cliente direto à reserva.'
        Screenshot = 'site-cliente.webp'
        Crop = [System.Drawing.Rectangle]::new(0, 0, 1400, 650)
        Cta = 'CONHEÇA A ORGANYZE'
        Subcta = 'LINK NA BIO'
    }
)

$background = [System.Drawing.ColorTranslator]::FromHtml('#0F1115')
$surface = [System.Drawing.ColorTranslator]::FromHtml('#1F232A')
$deepBlue = [System.Drawing.ColorTranslator]::FromHtml('#0D47FF')
$primary = [System.Drawing.ColorTranslator]::FromHtml('#2563FF')
$accent = [System.Drawing.ColorTranslator]::FromHtml('#00D4FF')
$white = [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#E1E1E1')
$logo = [System.Drawing.Image]::FromFile($logoPath)

foreach ($slide in $slides) {
    $canvas = [System.Drawing.Bitmap]::new(1080, 1920)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear($background)

    $primaryBrush = [System.Drawing.SolidBrush]::new($primary)
    $deepBlueBrush = [System.Drawing.SolidBrush]::new($deepBlue)
    $accentBrush = [System.Drawing.SolidBrush]::new($accent)
    $whiteBrush = [System.Drawing.SolidBrush]::new($white)
    $mutedBrush = [System.Drawing.SolidBrush]::new($muted)
    $surfaceBrush = [System.Drawing.SolidBrush]::new($surface)
    $brandFont = New-Font $semiboldCollection.Families[0] 33
    $kickerFont = New-Font $semiboldCollection.Families[0] 23
    $headlineFont = New-Font $boldCollection.Families[0] 77
    $bodyFont = New-Font $regularCollection.Families[0] 33
    $labelFont = New-Font $regularCollection.Families[0] 22
    $ctaFont = New-Font $semiboldCollection.Families[0] 31
    $subctaFont = New-Font $semiboldCollection.Families[0] 22

    $progressWidth = 292
    for ($i = 0; $i -lt 3; $i++) {
        $brush = if ($i -le ([int]($slide.Kicker.Substring(0, 2)) - 1)) { $primaryBrush } else { $surfaceBrush }
        $g.FillRectangle($brush, 68 + $i * 326, 185, $progressWidth, 8)
    }

    $g.DrawImage($logo, 70, 250, 80, 80)
    Draw-Text $g 'ORGANYZE' $brandFont $whiteBrush 172 252 420 76
    Draw-Text $g $slide.Kicker $kickerFont $accentBrush 70 370 940 54

    $lineY = 443
    for ($i = 0; $i -lt $slide.Head.Count; $i++) {
        $brush = if ($i -eq $slide.AccentLine) { $accentBrush } else { $whiteBrush }
        Draw-Text $g $slide.Head[$i] $headlineFont $brush 68 $lineY 944 105
        $lineY += 105
    }
    Draw-Text $g $slide.Body $bodyFont $mutedBrush 70 781 930 150

    Draw-Text $g 'TELA REAL DO SISTEMA  ·  DADOS DEMONSTRATIVOS' $labelFont $mutedBrush 70 950 940 54
    $stageX = 64; $stageY = 1015; $stageW = 952; $stageH = 480
    $stage = New-RoundRect $stageX $stageY $stageW $stageH 28
    $g.FillPath($surfaceBrush, $stage)
    $opened = Open-Webp (Join-Path $assetDir $slide.Screenshot)
    $source = $opened.Image
    $crop = $slide.Crop
    $maxW = $stageW - 24; $maxH = $stageH - 24
    $scale = [Math]::Min($maxW / $crop.Width, $maxH / $crop.Height)
    $drawW = [float]($crop.Width * $scale)
    $drawH = [float]($crop.Height * $scale)
    $drawX = [float]($stageX + ($stageW - $drawW) / 2)
    $drawY = [float]($stageY + ($stageH - $drawH) / 2)
    $state = $g.Save()
    $g.SetClip($stage)
    $g.DrawImage($source, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawW, $drawH), $crop, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Restore($state)
    $stage.Dispose(); $source.Dispose(); $opened.Stream.Dispose()

    $button = New-RoundRect 70 1560 940 118 25
    $g.FillPath($deepBlueBrush, $button)
    $button.Dispose()
    $ctaY = if ($slide.Subcta) { 1572 } else { 1575 }
    Draw-Text $g $slide.Cta $ctaFont $whiteBrush 100 $ctaY 880 70 ([System.Drawing.StringAlignment]::Center)
    if ($slide.Subcta) {
        Draw-Text $g $slide.Subcta $subctaFont $whiteBrush 100 1637 880 28 ([System.Drawing.StringAlignment]::Center)
    }

    $filePath = Join-Path $outputDir $slide.File
    $canvas.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $brandFont.Dispose(); $kickerFont.Dispose(); $headlineFont.Dispose(); $bodyFont.Dispose(); $labelFont.Dispose(); $ctaFont.Dispose(); $subctaFont.Dispose()
    $primaryBrush.Dispose(); $deepBlueBrush.Dispose(); $accentBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose(); $surfaceBrush.Dispose()
    $g.Dispose(); $canvas.Dispose()
}

$logo.Dispose()
$regularCollection.Dispose(); $semiboldCollection.Dispose(); $boldCollection.Dispose()
Get-ChildItem -LiteralPath $outputDir -Filter '*.png' | Sort-Object Name | Select-Object Name, Length
