param(
    [string]$Only
)

Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$projectRoot = Split-Path -Parent $PSScriptRoot
$assetsDir = Join-Path $projectRoot 'src\assets\tour'
$outputDir = Join-Path $projectRoot 'public\marketing\instagram'
$fontDir = Join-Path $projectRoot 'public\fonts'
$logoPath = Join-Path $projectRoot 'public\logo.png'
$renderCacheDir = Join-Path ([System.IO.Path]::GetTempPath()) 'organyze-instagram-render'

New-Item -ItemType Directory -Force -Path $outputDir | Out-Null
New-Item -ItemType Directory -Force -Path $renderCacheDir | Out-Null

$fontRegularCollection = New-Object System.Drawing.Text.PrivateFontCollection
$fontSemiboldCollection = New-Object System.Drawing.Text.PrivateFontCollection
$fontBoldCollection = New-Object System.Drawing.Text.PrivateFontCollection
$fontRegularCollection.AddFontFile((Join-Path $fontDir 'Poppins-Regular.ttf'))
$fontSemiboldCollection.AddFontFile((Join-Path $fontDir 'Poppins-SemiBold.ttf'))
$fontBoldCollection.AddFontFile((Join-Path $fontDir 'Poppins-Bold.ttf'))

$regularFamily = $fontRegularCollection.Families[0]
$semiboldFamily = $fontSemiboldCollection.Families[0]
$boldFamily = $fontBoldCollection.Families[0]

function New-Font([System.Drawing.FontFamily]$family, [float]$size) {
    return [System.Drawing.Font]::new($family, $size, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
}

function Convert-WebpToPng([string]$path) {
    $outputPath = Join-Path $renderCacheDir (([System.IO.Path]::GetFileNameWithoutExtension($path)) + '.png')
    $bitmapImage = New-Object System.Windows.Media.Imaging.BitmapImage
    $bitmapImage.BeginInit()
    $bitmapImage.UriSource = [Uri]$path
    $bitmapImage.CacheOption = [System.Windows.Media.Imaging.BitmapCacheOption]::OnLoad
    $bitmapImage.EndInit()

    $encoder = New-Object System.Windows.Media.Imaging.PngBitmapEncoder
    $null = $encoder.Frames.Add([System.Windows.Media.Imaging.BitmapFrame]::Create($bitmapImage))
    $stream = [System.IO.File]::Create($outputPath)
    $encoder.Save($stream)
    $stream.Dispose()
    return $outputPath
}

function New-RoundedPath([System.Drawing.RectangleF]$rect, [float]$radius) {
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $diameter = $radius * 2
    $path.AddArc($rect.X, $rect.Y, $diameter, $diameter, 180, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Y, $diameter, $diameter, 270, 90)
    $path.AddArc($rect.Right - $diameter, $rect.Bottom - $diameter, $diameter, $diameter, 0, 90)
    $path.AddArc($rect.X, $rect.Bottom - $diameter, $diameter, $diameter, 90, 90)
    $path.CloseFigure()
    return $path
}

function Fill-RoundedRectangle($graphics, $brush, [System.Drawing.RectangleF]$rect, [float]$radius) {
    $path = New-RoundedPath $rect $radius
    $graphics.FillPath($brush, $path)
    $path.Dispose()
}

function Draw-Text($graphics, [string]$text, $font, $brush, [float]$x, [float]$y, [float]$width, [float]$height, [System.Drawing.StringAlignment]$alignment = [System.Drawing.StringAlignment]::Near) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = $alignment
    $format.LineAlignment = [System.Drawing.StringAlignment]::Near
    $format.Trimming = [System.Drawing.StringTrimming]::None
    $graphics.DrawString($text, $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $width, $height), $format)
    $format.Dispose()
}

function Draw-Arrow($graphics, $pen, [float]$x, [float]$y) {
    $graphics.DrawLine($pen, $x, $y, $x + 42, $y)
    $graphics.DrawLine($pen, $x + 42, $y, $x + 27, $y - 15)
    $graphics.DrawLine($pen, $x + 42, $y, $x + 27, $y + 15)
}

$stories = @(
    @{
        Source = 'dashboard.webp'
        Output = 'story-01-dashboard-v2.png'
        Number = '01 / 04'
        Kicker = 'CONTROLE TOTAL'
        Headline = "SEU NEGÓCIO`nEM UM SÓ LUGAR"
        Highlight = 'EM UM SÓ LUGAR'
        Benefit = "Agenda, clientes e faturamento`nsem depender de planilhas."
        Cta = 'COMECE SEU TESTE GRÁTIS'
        Accent = '#0D47FF'
    },
    @{
        Source = 'agenda.webp'
        Output = 'story-02-agenda-v2.png'
        Number = '02 / 04'
        Kicker = 'ROTINA ORGANIZADA'
        Headline = "SUA AGENDA`nSEM CAOS"
        Highlight = 'SEM CAOS'
        Benefit = "Horários, confirmações e atendimentos`nvisualizados em segundos."
        Cta = 'ORGANIZE SUA ROTINA AGORA'
        Accent = '#2563FF'
    },
    @{
        Source = 'agendamento.webp'
        Output = 'story-03-agendamento-online-v2.png'
        Number = '03 / 04'
        Kicker = 'AGENDAMENTO ONLINE'
        Headline = "RESERVAS`n24 HORAS POR DIA"
        Highlight = '24 HORAS POR DIA'
        Benefit = "Seus clientes escolhem o melhor horário`nmesmo quando você está offline."
        Cta = 'QUERO AGENDAMENTO ONLINE'
        Accent = '#00D4FF'
    },
    @{
        Source = 'site-cliente.webp'
        Output = 'story-04-site-profissional-v2.png'
        Number = '04 / 04'
        Kicker = 'PRESENÇA DIGITAL'
        Headline = "SEU NEGÓCIO`nALÉM DO INSTAGRAM"
        Highlight = 'ALÉM DO INSTAGRAM'
        Benefit = "Tenha um site profissional que transforma`nvisitas em novos agendamentos."
        Cta = 'CRIE SUA PRESENÇA DIGITAL'
        Accent = '#2563FF'
    }
)

if ($Only) {
    $stories = @($stories | Where-Object { $_.Output -eq $Only })
}

$background = [System.Drawing.ColorTranslator]::FromHtml('#0F1115')
$surface = [System.Drawing.ColorTranslator]::FromHtml('#1F232A')
$white = [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#E1E1E1')
$blue = [System.Drawing.ColorTranslator]::FromHtml('#2563FF')
$cyan = [System.Drawing.ColorTranslator]::FromHtml('#00D4FF')

foreach ($story in $stories) {
    $canvas = New-Object System.Drawing.Bitmap 1080, 1920
    $canvas.SetResolution(96, 96)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $graphics.Clear($background)

    $accent = [System.Drawing.ColorTranslator]::FromHtml($story.Accent)
    $accentBrush = New-Object System.Drawing.SolidBrush $accent
    $blueBrush = New-Object System.Drawing.SolidBrush $blue
    $surfaceBrush = New-Object System.Drawing.SolidBrush $surface
    $whiteBrush = New-Object System.Drawing.SolidBrush $white
    $mutedBrush = New-Object System.Drawing.SolidBrush $muted
    $cyanBrush = New-Object System.Drawing.SolidBrush $cyan

    # Flat graphic backdrop: no photographic scenery, 3D objects or artificial glow.
    $graphics.FillRectangle($accentBrush, 0, 0, 1080, 10)
    $graphics.FillRectangle($surfaceBrush, 760, 0, 320, 10)
    $gridPen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(28, $accent)), 1
    for ($x = 40; $x -le 1040; $x += 80) { $graphics.DrawLine($gridPen, $x, 0, $x, 1920) }
    for ($y = 80; $y -le 1840; $y += 80) { $graphics.DrawLine($gridPen, 0, $y, 1080, $y) }
    $graphics.FillRectangle($accentBrush, 0, 570, 1080, 16)
    $graphics.FillRectangle($accentBrush, 925, 1280, 155, 14)

    $logo = [System.Drawing.Image]::FromFile($logoPath)
    $graphics.DrawImage($logo, 68, 72, 74, 74)
    $logo.Dispose()

    $brandFont = New-Font $semiboldFamily 34
    $numberFont = New-Font $semiboldFamily 24
    $kickerFont = New-Font $semiboldFamily 23
    $headlineFont = New-Font $boldFamily 70
    $benefitFont = New-Font $regularFamily 36
    $ctaFont = New-Font $semiboldFamily 29
    $footerFont = New-Font $regularFamily 22

    $graphics.DrawString('ORGANYZE', $brandFont, $whiteBrush, 165, 82)
    Draw-Text $graphics $story.Number $numberFont $mutedBrush 800 89 210 45 ([System.Drawing.StringAlignment]::Far)

    $kickerRect = [System.Drawing.RectangleF]::new(68, 185, 360, 52)
    Fill-RoundedRectangle $graphics $accentBrush $kickerRect 12
    Draw-Text $graphics $story.Kicker $kickerFont $whiteBrush 88 195 320 38

    $headlineLines = $story.Headline -split "`n"
    Draw-Text $graphics $headlineLines[0] $headlineFont $whiteBrush 68 270 950 100
    Draw-Text $graphics $headlineLines[1] $headlineFont $accentBrush 68 365 950 105
    $underlinePen = New-Object System.Drawing.Pen $accent, 8
    $graphics.DrawLine($underlinePen, 70, 490, 330, 490)

    # Preserve the original system screenshot as a flat, unedited product card.
    $shadowBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(75, 0, 0, 0))
    Fill-RoundedRectangle $graphics $shadowBrush ([System.Drawing.RectangleF]::new(72, 632, 936, 591)) 28
    Fill-RoundedRectangle $graphics $surfaceBrush ([System.Drawing.RectangleF]::new(60, 620, 936, 591)) 28
    $screenPath = Convert-WebpToPng (Join-Path $assetsDir $story.Source)
    $screen = [System.Drawing.Image]::FromFile($screenPath)
    $clipPath = New-RoundedPath ([System.Drawing.RectangleF]::new(68, 628, 920, 575)) 20
    $state = $graphics.Save()
    $graphics.SetClip($clipPath)
    $graphics.DrawImage($screen, 68, 628, 920, 575)
    $graphics.Restore($state)
    $clipPath.Dispose()
    $screen.Dispose()

    $systemTagRect = [System.Drawing.RectangleF]::new(68, 1238, 350, 50)
    Fill-RoundedRectangle $graphics $surfaceBrush $systemTagRect 12
    $dotBrush = New-Object System.Drawing.SolidBrush $accent
    $graphics.FillEllipse($dotBrush, 88, 1254, 16, 16)
    $systemTagFont = New-Font $semiboldFamily 20
    $graphics.DrawString('TELA REAL DO SISTEMA', $systemTagFont, $mutedBrush, 118, 1248)

    Draw-Text $graphics $story.Benefit $benefitFont $whiteBrush 68 1340 945 125

    $ctaRect = [System.Drawing.RectangleF]::new(68, 1578, 944, 120)
    Fill-RoundedRectangle $graphics $accentBrush $ctaRect 28
    Draw-Text $graphics $story.Cta $ctaFont $whiteBrush 105 1617 790 55
    $arrowPen = New-Object System.Drawing.Pen $white, 5
    Draw-Arrow $graphics $arrowPen 918 1638

    $graphics.DrawLine($gridPen, 68, 1780, 1012, 1780)
    Draw-Text $graphics 'GESTÃO INTELIGENTE PARA NEGÓCIOS DE BELEZA' $footerFont $mutedBrush 68 1815 944 45

    $outputPath = Join-Path $outputDir $story.Output
    $canvas.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Png)

    $arrowPen.Dispose()
    $dotBrush.Dispose()
    $shadowBrush.Dispose()
    $underlinePen.Dispose()
    $gridPen.Dispose()
    $brandFont.Dispose()
    $numberFont.Dispose()
    $kickerFont.Dispose()
    $systemTagFont.Dispose()
    $headlineFont.Dispose()
    $benefitFont.Dispose()
    $ctaFont.Dispose()
    $footerFont.Dispose()
    $accentBrush.Dispose()
    $blueBrush.Dispose()
    $surfaceBrush.Dispose()
    $whiteBrush.Dispose()
    $mutedBrush.Dispose()
    $cyanBrush.Dispose()
    $graphics.Dispose()
    $canvas.Dispose()
}

$fontRegularCollection.Dispose()
$fontSemiboldCollection.Dispose()
$fontBoldCollection.Dispose()

Get-ChildItem -LiteralPath $renderCacheDir -Filter '*.png' | Remove-Item -Force
Remove-Item -LiteralPath $renderCacheDir -Force

Get-ChildItem -LiteralPath $outputDir -Filter '*-v2.png' | ForEach-Object {
    $image = [System.Drawing.Image]::FromFile($_.FullName)
    [PSCustomObject]@{
        Name = $_.Name
        Width = $image.Width
        Height = $image.Height
        SizeKB = [math]::Round($_.Length / 1KB)
    }
    $image.Dispose()
}
