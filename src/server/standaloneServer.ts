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
    // Warm up most frequent startup & scholium map files in background so player loading is fast
    if (data0Manager.isRemoteMode()) {
      const warmList = [
        'maps/scholium/scholium.map',
        'maps/scholium/scholium.toi2',
        'maps/scholium/scholium.rof',
        'maps/scholium/scholium.ent',
        'images/tilesheets/ma-in.sou',
        'char/000000.spr',
        'char/001000.spr',
        'data/misc/en_menu_image.txt',
        'data/strings/english/en_menustring.txt',
        'data/strings/english/en_quests.txt'
      ];
      void Promise.allSettled(warmList.map((p) => data0Manager.readEntryAsync(p))).then(() => {
        console.log(`[DR-Server] Warmed ${warmList.length} core assets into RAM cache`);
      });
    }
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
