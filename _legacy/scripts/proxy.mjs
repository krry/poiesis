// proxy.mjs
import http from 'http'
import https from 'https'

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', '*')
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  const proxy = https.request({ hostname: 'api.anthropic.com', path: req.url, method: req.method, headers: { ...req.headers, host: 'api.anthropic.com' } }, r => { res.writeHead(r.statusCode, r.headers); r.pipe(res) })
  req.pipe(proxy)
}).listen(3010, () => console.log('proxy on 3010'))
