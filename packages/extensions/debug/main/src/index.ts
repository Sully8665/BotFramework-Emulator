import { IPC, CommandService, IActivity } from '@bfemulator/sdk-shared';
import { ProcessIPC, WebSocketIPC, stayAlive } from '@bfemulator/sdk-main';
import * as path from 'path';
const config = require('../../bf-extension.json');

/**
 * READ READ: All the junk below will be rolled into a tidy extension SDK that is TBD.
 * We're defining its internals here! right now!
 */

stayAlive();

console.log(`Debug Extension running. pid: ${process.pid}`);

let ipc: IPC;

if (process.send) {
  // We're a child process
  ipc = new ProcessIPC(process);
} else {
  // We're a peer process
  config.node = config.node || {};
  config.node.debug = config.node.debug || {};
  config.node.debug.webpack = config.node.debug.websocket || {};
  config.node.debug.webpack.port = config.node.debug.websocket.port || 3030;
  config.node.debug.webpack.host = config.node.debug.websocket.host || "localhost";
  ipc = new WebSocketIPC(`http://${config.node.debug.websocket.host}:${config.node.debug.websocket.port}`);
  ipc.id = process.pid;
  const connector = new CommandService(ipc, 'connector');
  connector.on('hello', () => {
    return {
      id: ipc.id,
      configPath: path.resolve('../../'),
      config
    }});
}

const commands = new CommandService(ipc, `ext-${ipc.id}`);

//commands.remoteCall('ext-ping')
//  .then(reply => console.log(reply))
//  .catch(err => console.log('ping failed', err));

commands.on('connect', () => {
  console.log('[Debug Ext] got connect');
});

commands.on('disconnect', () => {
  console.log('[Debug Ext] got disconnect');
  process.exit();
});

commands.on('ext-ping', () => {
  return '[Debug Ext] ext-pong';
});

commands.on('get-inspector-url', (activities: IActivity[]): string => {
  const encodedActivities = encodeURIComponent(JSON.stringify(activities));
  return `client/inspect.html?activities=${encodedActivities}`;
});

