$port = 8080
$root = (Get-Location).Path

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "Servidor iniciado en http://localhost:$port/"
Write-Host "Presiona Ctrl+C para detener."

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $url = $request.RawUrl.Split('?')[0]
        if ($url -eq "/") { $url = "/index.html" }
        
        $filePath = Join-Path $root $url.Replace('/', '\')
        
        if (Test-Path $filePath -PathType Leaf) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "text/plain"
            switch ($ext) {
                ".html" { $mime = "text/html" }
                ".css"  { $mime = "text/css" }
                ".js"   { $mime = "application/javascript" }
                ".json" { $mime = "application/json" }
                ".png"  { $mime = "image/png" }
                ".jpg"  { $mime = "image/jpeg" }
            }
            
            $response.ContentType = $mime
            
            try {
                $content = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $content.Length
                $response.OutputStream.Write($content, 0, $content.Length)
            } catch {
                $response.StatusCode = 500
            }
        } else {
            $response.StatusCode = 404
        }
        
        $response.Close()
    }
} finally {
    $listener.Stop()
}
