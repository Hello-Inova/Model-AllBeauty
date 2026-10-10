Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName PresentationCore

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourceDir = Join-Path $projectRoot 'src\assets\tour'
$outputDir = Join-Path $projectRoot 'public\marketing\instagram\carrossel-semana-1-dia-1-telas-reais'
$logoPath = Join-Path $projectRoot 'public\marketing\brand\organyze-logo-oficial.png'
$fontDir = Join-Path $projectRoot 'public\fonts'
New-Item -ItemType Directory -Force -Path $outputDir | Out-Null

$fonts = New-Object System.Drawing.Text.PrivateFontCollection
$fonts.AddFontFile((Join-Path $fontDir 'Poppins-Regular.ttf'))
$fonts.AddFontFile((Join-Path $fontDir 'Poppins-SemiBold.ttf'))
$fonts.AddFontFile((Join-Path $fontDir 'Poppins-Bold.ttf'))
$regular = $fonts.Families | Where-Object { $_.Name -eq 'Poppins' } | Select-Object -First 1
if (-not $regular) { $regular = $fonts.Families[0] }

function New-Font([float]$size, [System.Drawing.FontStyle]$style = [System.Drawing.FontStyle]::Regular) {
    return [System.Drawing.Font]::new($regular, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
    $p = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = $r * 2
    $p.AddArc($x, $y, $d, $d, 180, 90)
    $p.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
    $p.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
    $p.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
    $p.CloseFigure()
    return $p
}

function Draw-Text($g, [string]$value, $font, $brush, [float]$x, [float]$y, [float]$w, [float]$h, [System.Drawing.StringAlignment]$alignment = [System.Drawing.StringAlignment]::Near) {
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = $alignment
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    $format.Trimming = [System.Drawing.StringTrimming]::None
    $g.DrawString($value, $font, $brush, [System.Drawing.RectangleF]::new($x, $y, $w, $h), $format)
    $format.Dispose()
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
    @{ File='01-capa.png'; Number='CARROSSEL 01 / 07'; Head=@('5 SINAIS DE QUE', 'SUA AGENDA ESTÁ', 'ATRAPALHANDO SEU', 'CRESCIMENTO'); Body=''; Screenshot='agenda.webp'; CropHeight=600; HeadSize=63; StageTop=452; StageHeight=470 },
    @{ File='02-horarios-espalhados.png'; Number='SINAL 01 / 05'; Head=@('HORÁRIOS ESPALHADOS', 'EM VÁRIOS LUGARES'); Body='Mensagens, papel e planilhas dificultam a visão da rotina.'; Screenshot='agenda.webp'; CropHeight=600; HeadSize=61; StageTop=420; StageHeight=502 },
    @{ File='03-confirmacoes-manuais.png'; Number='SINAL 02 / 05'; Head=@('CONFIRMAR HORÁRIOS', 'TOMA TEMPO DEMAIS'); Body='Responder cada consulta interrompe o seu atendimento.'; Screenshot='agendamento.webp'; CropHeight=830; HeadSize=61; StageTop=420; StageHeight=502 },
    @{ File='04-clientes-esperam-resposta.png'; Number='SINAL 03 / 05'; Head=@('O CLIENTE PRECISA', 'ESPERAR SUA RESPOSTA'); Body='Se você está ocupada, ele não consegue reservar na hora.'; Screenshot='agendamento.webp'; CropHeight=830; HeadSize=61; StageTop=420; StageHeight=502 },
    @{ File='05-falta-visao-da-rotina.png'; Number='SINAL 04 / 05'; Head=@('FALTA UMA VISÃO', 'CLARA DA ROTINA'); Body='Você perde tempo procurando informações da agenda e dos clientes.'; Screenshot='dashboard.webp'; CropHeight=600; HeadSize=64; StageTop=420; StageHeight=502 },
    @{ File='06-instagram-nao-agenda.png'; Number='SINAL 05 / 05'; Head=@('O INSTAGRAM ATRAI,', 'MAS NÃO AGENDA'); Body='O cliente vê seu negócio, mas ainda precisa pedir um horário.'; Screenshot='site-cliente.webp'; CropHeight=650; HeadSize=64; StageTop=420; StageHeight=502 },
    @{ File='07-chamada-final.png'; Number='SUA PRÓXIMA ETAPA'; Head=@('QUANTOS DESSES', 'ACONTECEM NO SEU', 'NEGÓCIO?'); Body='Com a Organyze, seu site e sua agenda trabalham juntos.'; Screenshot='agendamento.webp'; CropHeight=830; HeadSize=66; StageTop=454; StageHeight=468 }
)

$background = [System.Drawing.ColorTranslator]::FromHtml('#111316')
$surface = [System.Drawing.ColorTranslator]::FromHtml('#202329')
$gold = [System.Drawing.ColorTranslator]::FromHtml('#B2883F')
$white = [System.Drawing.ColorTranslator]::FromHtml('#FFFFFF')
$muted = [System.Drawing.ColorTranslator]::FromHtml('#D5D5D0')
$subtle = [System.Drawing.ColorTranslator]::FromHtml('#9EA1A5')
$logo = [System.Drawing.Image]::FromFile($logoPath)

foreach ($slide in $slides) {
    $canvas = [System.Drawing.Bitmap]::new(1080, 1080)
    $g = [System.Drawing.Graphics]::FromImage($canvas)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
    $g.Clear($background)

    $goldBrush = [System.Drawing.SolidBrush]::new($gold)
    $whiteBrush = [System.Drawing.SolidBrush]::new($white)
    $mutedBrush = [System.Drawing.SolidBrush]::new($muted)
    $subtleBrush = [System.Drawing.SolidBrush]::new($subtle)
    $surfaceBrush = [System.Drawing.SolidBrush]::new($surface)
    $brandFont = New-Font 29 ([System.Drawing.FontStyle]::Bold)
    $smallFont = New-Font 20 ([System.Drawing.FontStyle]::Regular)
    $bodyFont = New-Font 27 ([System.Drawing.FontStyle]::Regular)
    $headFont = New-Font $slide.HeadSize ([System.Drawing.FontStyle]::Bold)

    $g.FillRectangle($goldBrush, 0, 0, 1080, 9)
    $g.DrawImage($logo, 66, 47, 66, 66)
    Draw-Text $g 'ORGANYZE' $brandFont $whiteBrush 149 45 380 70
    Draw-Text $g $slide.Number $smallFont $mutedBrush 687 52 325 54 ([System.Drawing.StringAlignment]::Far)

    $lineY = 148
    foreach ($line in $slide.Head) {
        $brush = if ($line -eq 'CRESCIMENTO' -or $line -eq 'MAS NÃO AGENDA' -or $line -eq 'NEGÓCIO?') { $goldBrush } else { $whiteBrush }
        Draw-Text $g $line $headFont $brush 66 $lineY 948 76
        $lineY += 72
    }
    $bodyY = if ($slide.Head.Count -eq 4) { 368 } elseif ($slide.Head.Count -eq 3) { 372 } else { 314 }
    if ($slide.Body) { Draw-Text $g $slide.Body $bodyFont $mutedBrush 68 $bodyY 944 82 }

    $stageX = 64
    $stageY = [float]$slide.StageTop
    $stageW = 952
    $stageH = [float]$slide.StageHeight
    $stage = New-RoundRect $stageX $stageY $stageW $stageH 24
    $g.FillPath($surfaceBrush, $stage)

    $opened = Open-Webp (Join-Path $sourceDir $slide.Screenshot)
    $source = $opened.Image
    if ($slide.Screenshot -eq 'agendamento.webp') {
        $crop = [System.Drawing.Rectangle]::new(265, 65, 815, 740)
    } else {
        $crop = [System.Drawing.Rectangle]::new(0, 0, $source.Width, [Math]::Min([int]$slide.CropHeight, $source.Height))
    }
    $maxW = $stageW - 24
    $maxH = $stageH - 24
    $scale = [Math]::Min($maxW / $crop.Width, $maxH / $crop.Height)
    $drawW = [float]($crop.Width * $scale)
    $drawH = [float]($crop.Height * $scale)
    $drawX = [float]($stageX + ($stageW - $drawW) / 2)
    $drawY = [float]($stageY + ($stageH - $drawH) / 2)
    $state = $g.Save()
    $g.SetClip($stage)
    $g.DrawImage($source, [System.Drawing.RectangleF]::new($drawX, $drawY, $drawW, $drawH), $crop, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Restore($state)
    $source.Dispose()
    $opened.Stream.Dispose()
    $stage.Dispose()

    if ($slide.File -eq '07-chamada-final.png') {
        $ctaFont = New-Font 23 ([System.Drawing.FontStyle]::Bold)
        Draw-Text $g 'ACESSE O LINK NA BIO' $ctaFont $goldBrush 66 926 948 40 ([System.Drawing.StringAlignment]::Center)
        $ctaFont.Dispose()
    }

    $linePen = [System.Drawing.Pen]::new($gold, 2)
    $g.DrawLine($linePen, 66, 970, 1014, 970)
    Draw-Text $g 'TELA REAL DO SISTEMA  ·  DADOS DEMONSTRATIVOS' $smallFont $subtleBrush 66 987 948 50
    $linePen.Dispose()

    $filePath = Join-Path $outputDir $slide.File
    $canvas.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $brandFont.Dispose(); $smallFont.Dispose(); $bodyFont.Dispose(); $headFont.Dispose()
    $goldBrush.Dispose(); $whiteBrush.Dispose(); $mutedBrush.Dispose(); $subtleBrush.Dispose(); $surfaceBrush.Dispose()
    $g.Dispose(); $canvas.Dispose()
}

$logo.Dispose()
$fonts.Dispose()
Get-ChildItem -LiteralPath $outputDir -Filter '*.png' | Sort-Object Name | Select-Object Name, Length
