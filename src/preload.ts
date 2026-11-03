import {contextBridge,ipcRenderer,webUtils} from 'electron';
contextBridge.exposeInMainWorld('desktop',{
  call:(method:string,...args:unknown[])=>ipcRenderer.invoke('desktop',method,...args),
  on:(callback:(message:unknown)=>void)=>{ipcRenderer.on('event',(_event,message)=>callback(message));},
  platform:process.platform,
  getPathForFile:(file:File)=>webUtils ? webUtils.getPathForFile(file) : (file as any).path
});
