/*
 * NekoAPI
 * © Nimzz
 */
 
import { Application, Request, Response, NextFunction } from 'express';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { logRouterRequest } from './logger';

const registeredRoutes = new Set<string>();
let app: Application;
let config: any;

const methods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head']; // metode

const readJson = (filePath: string) => JSON.parse(fs.readFileSync(filePath, 'utf-8'));

const getEndpoints = (cwd: string) => {
    const folder = path.join(cwd, 'src', 'endpoints');
    if (!fs.existsSync(folder)) return {};
    
    const endpoints: Record<string, any[]> = {};
    
    for (const file of fs.readdirSync(folder)) {
        if (!file.endsWith('.json')) continue;

        const name = file.replace('.json', '');
        const filePath = path.join(folder, file);

        try {
            const data = readJson(filePath);
            endpoints[name] = Array.isArray(data) ? data : data.endpoints || [];
            console.log(`[i] Loaded endpoints: ${name} (${endpoints[name].length} routes)`);
        } catch (error) {
            console.error(`[!] Failed to load ${file}:`, error);
        }
    }

    return endpoints;
};

export const buildConfig = (configPath: string, cwd: string) => {
    const data = readJson(configPath);
    data.tags = { ...(data.tags || {}), ...getEndpoints(cwd) };
    return data;
};

const getRouteFile = (category: string, filename: string) => {
    const folders = [
        path.join(__dirname, '..', 'router', category),
        path.join(process.cwd(), 'router', category),
        path.join(process.cwd(), 'dist', 'router', category)
    ];

    // Urutan pencarian: TypeScript/JS (CommonJS) dulu, lalu ESM (.mjs), lalu Go, lalu PHP.
    for (const folder of folders) {
        for (const extension of ['.ts', '.js', '.mjs', '.go', '.php']) {
            const filePath = path.join(folder, `${filename}${extension}`);
            if (fs.existsSync(filePath)) return filePath;
        }
    }

    return null;
};

const getRouteKey = (route: any) =>
    `${String(route.method).toLowerCase()}:${route.endpoint}`;

// ============================================================
// Dukungan multi-bahasa: .go dan .php dijalankan sebagai subprocess.
// Input dikirim lewat stdin berupa JSON `{query, body}`, endpoint di
// Go/PHP wajib print SATU baris JSON ke stdout sebagai response.
// Catatan: ini butuh runtime `go`/`php` terpasang di server (VPS/PM2).
// Di Vercel serverless, keduanya TIDAK tersedia — endpoint Go/PHP akan
// otomatis dilewati dengan pesan yang jelas, bukan bikin server crash.
// ============================================================

const runtimeAvailability = new Map<string, boolean>();
const goBinaryCache = new Map<string, string>();

const isRuntimeAvailable = (cmd: string): boolean => {
    if (runtimeAvailability.has(cmd)) return runtimeAvailability.get(cmd)!;

    let available = false;
    try {
        execSync(`${cmd} version`, { stdio: 'ignore', timeout: 5000 });
        available = true;
    } catch {
        available = false;
    }

    runtimeAvailability.set(cmd, available);
    return available;
};

const runSubprocess = (cmd: string, args: string[], inputJson: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const proc = spawn(cmd, args, { timeout: 15000 });
        let stdout = '';
        let stderr = '';

        proc.stdout.on('data', (chunk) => { stdout += chunk; });
        proc.stderr.on('data', (chunk) => { stderr += chunk; });
        proc.on('error', (err) => reject(err));
        proc.on('close', (code) => {
            if (code !== 0) {
                return reject(new Error(stderr.trim() || `Process exited with code ${code}`));
            }
            resolve(stdout.trim());
        });

        proc.stdin.write(inputJson);
        proc.stdin.end();
    });
};

const compileGoBinary = async (filePath: string): Promise<string> => {
    const cached = goBinaryCache.get(filePath);
    if (cached && fs.existsSync(cached)) return cached;

    const binPath = filePath.replace(/\.go$/, process.platform === 'win32' ? '.exe' : '.bin');

    await new Promise<void>((resolve, reject) => {
        const build = spawn('go', ['build', '-o', binPath, filePath]);
        let stderr = '';
        build.stderr.on('data', (chunk) => { stderr += chunk; });
        build.on('error', reject);
        build.on('close', (code) => {
            code === 0 ? resolve() : reject(new Error(stderr.trim() || 'go build failed'));
        });
    });

    goBinaryCache.set(filePath, binPath);
    return binPath;
};

/** Handler untuk endpoint .go / .php — dijalankan sebagai subprocess terpisah. */
const createSubprocessHandler = (filePath: string, ext: '.go' | '.php') => {
    return async (req: Request, res: Response) => {
        const runtimeCmd = ext === '.go' ? 'go' : 'php';

        if (!isRuntimeAvailable(runtimeCmd)) {
            return res.status(501).json({
                status: false,
                message: `Runtime '${runtimeCmd}' tidak tersedia di server ini. Endpoint ${ext} butuh server dengan ${runtimeCmd} terinstal (tidak berjalan di Vercel serverless).`
            });
        }

        const input = JSON.stringify({ query: req.query, body: req.body || {} });

        try {
            let output: string;

            if (ext === '.go') {
                const binPath = await compileGoBinary(filePath);
                output = await runSubprocess(binPath, [], input);
            } else {
                output = await runSubprocess('php', [filePath], input);
            }

            let parsed: any;
            try {
                parsed = JSON.parse(output);
            } catch {
                throw new Error(`Output ${ext} bukan JSON valid: ${output.slice(0, 200)}`);
            }

            res.json(parsed);
        } catch (error: any) {
            res.status(500).json({
                status: false,
                message: error.message || `Gagal menjalankan endpoint ${ext}`
            });
        }
    };
};

/** Handler untuk endpoint .mjs — di-import secara async & di-cache setelah load pertama. */
const createEsmHandler = (filePath: string) => {
    let cached: Function | null = null;
    let loadError: Error | null = null;

    return async (req: Request, res: Response, next: NextFunction) => {
        if (!cached && !loadError) {
            try {
                const mod: any = await import(`file://${filePath}?t=${Date.now()}`);
                const fn = mod.default || mod;
                if (typeof fn !== 'function') throw new Error('Module tidak export function default');
                cached = fn;
            } catch (error: any) {
                loadError = error;
            }
        }

        if (loadError) return next(loadError);
        if (!cached) return next(new Error('ESM handler gagal dimuat'));

        return cached(req, res, next);
    };
};

const registerRoute = (
    route: any,
    category: string,
    creator: string,
    targetApp: Application
) => {
    const method = String(route.method || '').toLowerCase();
    const routeKey = getRouteKey(route);

    if (registeredRoutes.has(routeKey)) return;

    if (!methods.includes(method)) {
        console.error(`[!] Unsupported method: ${route.method} ${route.endpoint}`);
        return;
    }

    if (!route.endpoint || !route.filename) {
        console.error('[!] Invalid route configuration:', route);
        return;
    }

    const filePath = getRouteFile(category, route.filename);

    if (!filePath) {
        console.error(`[!] File not found: router/${category}/${route.filename}`);
        return;
    }

    const ext = path.extname(filePath);

    try {
        let handler: Function;

        if (ext === '.go' || ext === '.php') {
            handler = createSubprocessHandler(filePath, ext);
        } else if (ext === '.mjs') {
            handler = createEsmHandler(filePath);
        } else {
            delete require.cache[require.resolve(filePath)];
            const routeModule = require(filePath);
            handler = routeModule.default || routeModule;
        }

        if (typeof handler !== 'function') {
            console.error(`[!] Invalid handler: ${filePath}`);
            return;
        }

        const routeHandler = async (req: Request, res: Response, next: NextFunction) => {
            logRouterRequest(req, res);

            const oldJson = res.json.bind(res);

            res.json = (body: any) => {
                if (body && typeof body === 'object' && !Array.isArray(body)) {
                    return oldJson({ creator, ...body });
                }

                return oldJson(body);
            };

            try {
                await handler(req, res, next);
            } catch (error) {
                next(error);
            }
        };

        (targetApp as any)[method](route.endpoint, routeHandler);
        registeredRoutes.add(routeKey);

        console.log(`[+] Loaded (${ext}): ${route.method} ${route.endpoint} -> ${path.basename(filePath)}`);
    } catch (error) {
        console.error(`[!] Failed to load ${route.endpoint}:`, error);
    }
};

export const loadRouter = (targetApp: Application, targetConfig: any) => {
    app = targetApp;
    config = targetConfig;

    if (!config.tags) {
        console.error('[!] tags not found in config.json');
        return;
    }

    const creator = config.settings?.creator || '';

    for (const category of Object.keys(config.tags)) {
        const routes = config.tags[category];
        if (!Array.isArray(routes)) continue;

        for (const route of routes) {
            registerRoute(route, category, creator, targetApp);
        }
    }
};

const reloadRouter = () => {
    if (!app || !config) return;
    loadRouter(app, config);
};

export const initAutoLoad = (
    targetApp: Application,
    targetConfig: any,
    configPath: string
) => {
    app = targetApp;
    config = targetConfig;

    console.log('[OK] Auto Load Activated');

    if (fs.existsSync(configPath)) {
        fs.watch(configPath, (event, filename) => {
            if (event !== 'change' || !filename) return;

            try {
                const newConfig = readJson(configPath);

                config = {
                    ...newConfig,
                    tags: {
                        ...(newConfig.tags || {}),
                        ...getEndpoints(process.cwd())
                    }
                };

                reloadRouter();
                console.log('[OK] Config reloaded');
            } catch (error) {
                console.error('[!] Failed to reload config:', error);
            }
        });
    }

    const endpointsFolder = path.join(process.cwd(), 'src', 'endpoints');

    if (fs.existsSync(endpointsFolder)) {
        fs.watch(endpointsFolder, (event, filename) => {
            if (event !== 'change' || !filename || !filename.endsWith('.json')) return;

            try {
                config.tags = {
                    ...(config.tags || {}),
                    ...getEndpoints(process.cwd())
                };

                reloadRouter();
                console.log(`[OK] Endpoint reloaded: ${filename}`);
            } catch (error) {
                console.error('[!] Failed to reload endpoint:', error);
            }
        });
    }
};