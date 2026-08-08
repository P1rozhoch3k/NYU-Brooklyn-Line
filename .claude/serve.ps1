$root = Split-Path -Parent $PSScriptRoot
$port = 5588
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Serving $root on http://localhost:$port/"

$mime = @{
  ".html"       = "text/html; charset=utf-8"
  ".css"        = "text/css; charset=utf-8"
  ".js"         = "application/javascript; charset=utf-8"
  ".json"       = "application/json; charset=utf-8"
  ".webmanifest" = "application/manifest+json; charset=utf-8"
  ".ico"        = "image/x-icon"
  ".svg"        = "image/svg+xml"
  ".png"        = "image/png"
}

while ($listener.IsListening) {
  $context = $listener.GetContext()
  $request = $context.Request
  $response = $context.Response
  try {
    $path = $request.Url.LocalPath
    if ($path -eq "/") { $path = "/index.html" }
    $filePath = Join-Path $root ($path.TrimStart("/"))
    $filePath = [System.IO.Path]::GetFullPath($filePath)
    if (-not $filePath.StartsWith([System.IO.Path]::GetFullPath($root))) {
      $response.StatusCode = 403
      $response.Close()
      continue
    }
    if (Test-Path $filePath -PathType Leaf) {
      $ext = [System.IO.Path]::GetExtension($filePath)
      $contentType = $mime[$ext]
      if (-not $contentType) { $contentType = "application/octet-stream" }
      $response.ContentType = $contentType
      $response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate")
      $bytes = [System.IO.File]::ReadAllBytes($filePath)
      $response.ContentLength64 = $bytes.Length
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
      $response.StatusCode = 404
      $bytes = [System.Text.Encoding]::UTF8.GetBytes("Not found")
      $response.OutputStream.Write($bytes, 0, $bytes.Length)
    }
  } catch {
    $response.StatusCode = 500
  } finally {
    $response.Close()
  }
}
