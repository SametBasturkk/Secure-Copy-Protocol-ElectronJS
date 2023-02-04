/* eslint-disable promise/catch-or-return */
/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */
import path from 'path';
import { JsonDB, Config } from 'node-json-db';
import { app, BrowserWindow, shell, ipcMain, ipcRenderer } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { Client } from 'node-scp';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';

async function saveToDB(
  serverName: string,
  ip: string,
  port: string,
  user: string,
  pass: string
) {
  const db = new JsonDB(new Config('scpDB', true, false, `/`));
  db.push(`/${serverName}`, { serverName, ip, port, user, pass }, true);
}

async function getFromDB(serverName: string) {
  const db = await new JsonDB(
    new Config('scpDB', true, false, `${serverName}`)
  );
  const data = await db.getData(`/${serverName}`);
  return data;
}

async function deleteFromDB(serverName: string) {
  const db = await new JsonDB(new Config('scpDB', true, false, `/`));
  await db.delete(`/${serverName}`);
}

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  ipcMain.on('getFromDB', async (event, arg) => {
    const data = await getFromDB(arg);
    event.reply('getFromDB', data);
  });

  ipcMain.on('saveToDB', async (event, arg) => {
    const { serverName, ip, port, user, pass } = arg;
    await saveToDB(serverName, ip, port, user, pass);
    event.reply('saveToDB', 'saved');
  });

  ipcMain.on('deleteFromDB', async (event, arg) => {
    await deleteFromDB(arg);
    event.reply('deleteFromDB', 'deleted');
  });

  ipcMain.on('folderList', async (event, server, pathServer) => {
    const dbInfo = await getFromDB('');
    const serverInfo = dbInfo[server];
    console.log(`Server Info:${serverInfo}`);
    console.log(`Path:${pathServer}`);

    try {
      await Client({
        host: serverInfo.ip,
        port: Number(serverInfo.port),
        username: serverInfo.user,
        password: serverInfo.pass,
      }).then((client) => {
        if (serverInfo.user === 'root') {
          console.log('rootFirst');
          client.list(pathServer).then((list) => {
            event.reply('folderList', list);
            console.log(list);
          });
        }
      });
    } catch (error) {
      event.reply('folderList', 'error');
    }
  });

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  })
  .catch(console.log);
