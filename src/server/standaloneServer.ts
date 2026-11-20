import http from 'node:http';
import { createData0Middleware, data0Manager, wasmNetServer } from './data0StreamPlugin';

const PORT = Number(process.env.PORT || '10000');
const middleware = createData0Middleware();

async function main() {
  try {
    await data0Manager.ensureInitializedAsync();
    wasmNetServer.loadLevelExpTable();
    console.log(
      `[DR-Server] Data0 initialized (mode=${data0Manager.isRemoteMode() ? 'remote-range' : 'local-disk'})`
    );
    // Warm up core & starter map gzipped bundles in background so first player login is super fast
    void Promise.allSettled([
      data0Manager.getCoreBundleGzipAsync(),
      data0Manager.getMapBundleGzipAsync('scholium'),
      data0Manager.getMapBundleGzipAsync('scholium2')
    ]).then(() => {
      console.log('[DR-Server] Warmed core, scholium, and scholium2 preload bundles into RAM');
    });
  } catch (err) {
    console.warn('[DR-Server] Data0 init warning (check DR_DATA0_URL or DR_DATA0_PATH):', err);
  }

  const server = http.createServer((req, res) => {
    if (req.url === '/' || req.url === '/health') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          ok: true,
          service: 'dragon-raja-online-server',
          mode: data0Manager.isRemoteMode() ? 'remote-range' : 'local-disk'
        })
      );
      return;
    }

    middleware(req, res, () => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.statusCode = 404;
      res.end('Not Found');
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[DR-Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

main();
