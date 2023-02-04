import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ipcRenderer } from 'electron';
import { Button, Tree } from 'antd';

const { DirectoryTree } = Tree;
const treeData = [];

const ConnectServer = () => {
  const param = useParams();
  const paramArray = param.id;
  const server = paramArray.split('+')[0];
  const path = paramArray.split('+')[1];
  console.log(server);
  console.log(path);

  const [files, setFiles] = useState([]); // initialize state with an empty array
  const [treeData, setTreeData] = useState([]);

  function fileExplorer(server, path) {
    if (!server || !path) return;

    ipcRenderer.send('folderList', server, path);
    ipcRenderer.on('folderList', (event, arg) => {
      setFiles(arg);
      const newTreeData = [];
      for (let i = 0; i < arg.length; i++) {
        if (arg[i].type === 'd') {
          const schema = {
            title: arg[i].name,
            key: arg[i].name,
          };
          newTreeData.push(schema);
        } else {
          const schema = {
            title: arg[i].name,
            key: arg[i].name,
            isLeaf: true,
          };
          newTreeData.push(schema);
        }
      }
      setTreeData(newTreeData);
    });
  }

  async function connectServer(server) {
    if (server === undefined) {
      console.log('undefined');
    } else {
      if (path == 'root') {
        ipcRenderer.send('folderList', server, '/root');
      } else {
        ipcRenderer.send('folderList', server, path);
      }
      ipcRenderer.on('folderList', (event, arg) => {
        setFiles(arg); // update the state with the list of files
        console.log(arg);
        for (let i = 0; i < arg.length; i++) {
          if (arg[i].type === 'd') {
            console.log('isDir');
            const schema = {
              title: arg[i].name,
              key: arg[i].name,
            };
            treeData.push(schema);
          } else {
            console.log('isFile');
            const schema = {
              title: arg[i].name,
              key: arg[i].name,
              isLeaf: true,
            };
            treeData.push(schema);
          }
        }
      });
      console.log('connected');
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await connectServer(server);
    };
    fetchData();
  }, [server]);

  const [selectedFile, setSelectedFile] = useState('');
  const [selectedDir, setSelectedDir] = useState('');

  const onSelect = (keys, info) => {
    console.log('Trigger Select', keys, info);
    setSelectedDir(path);
    setSelectedFile(`${path}/${keys}`);
    fileExplorer(server, `/${path}/${keys}/`);
  };

  if (files.length === 0) {
    return (
      <div>
        <h1>Connected to: {server} </h1>
        <h1>Loading</h1>
      </div>
    );
  }

  const handleBackClick = () => {
    console.log('back');
    console.log(selectedDir);
    const newPath = selectedDir.split('/');
    newPath.pop();
    const newDir = newPath.join('/');
    console.log(newDir);
    fileExplorer(server, `/${newDir}/`);
  };

  const handleForwardClick = () => {
    console.log('forward');
    console.log(selectedFile);
    fileExplorer(server, `${path}/${selectedFile}/`);
  };

  return (
    <div>
      <h1>Connected to: {server} </h1>
      <Button id="backButton" icon="left" onClick={handleBackClick} />
      <Button id="forwardButton" icon="right" onClick={handleForwardClick} />
      <DirectoryTree height={233} onSelect={onSelect} treeData={treeData} />
      <span>Selected File: {selectedFile}</span>
    </div>
  );
};

export default ConnectServer;
