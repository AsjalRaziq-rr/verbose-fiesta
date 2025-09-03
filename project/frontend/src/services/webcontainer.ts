import { WebContainer } from '@webcontainer/api';

let webcontainerInstance: WebContainer | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  if (!webcontainerInstance) {
    webcontainerInstance = await WebContainer.boot();
  }
  return webcontainerInstance;
}

export async function mountFiles(files: { [key: string]: any }) {
  const webcontainer = await getWebContainer();
  await webcontainer.mount(files);
}

export async function runCommand(command: string): Promise<string> {
  const webcontainer = await getWebContainer();
  const process = await webcontainer.spawn('sh', ['-c', command]);
  
  let output = '';
  process.output.pipeTo(new WritableStream({
    write(data) {
      output += data;
    }
  }));
  
  const exitCode = await process.exit;
  return output;
}

export async function startDevServer(isReactApp: boolean = false): Promise<string> {
  const webcontainer = await getWebContainer();
  
  // Install dependencies first
  await runCommand('npm install');
  
  // Start appropriate dev server
  const command = isReactApp ? 'npm start' : 'npm run dev';
  const serverProcess = await webcontainer.spawn('sh', ['-c', command]);
  
  // Wait for server to be ready
  webcontainer.on('server-ready', (port, url) => {
    console.log(`Server ready at ${url}`);
  });
  
  const defaultPort = isReactApp ? '3000' : '5173';
  return `http://localhost:${defaultPort}`;
}