import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Button,
  Layout,
  Menu,
  theme,
  Modal,
  Checkbox,
  Form,
  Input,
} from 'antd';

import {
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CloudServerOutlined,
  CloseOutlined,
  EditOutlined,
} from '@ant-design/icons';

import { ipcRenderer } from 'electron';

const { Header, Content, Footer, Sider } = Layout;

function deleteFromDB(serverName: string) {
  ipcRenderer.send('deleteFromDB', serverName);
  window.location.reload();
}

function addServer(
  serverName: string,
  ip: string,
  port: string,
  user: string,
  pass: string
) {
  ipcRenderer.send('saveToDB', {
    serverName,
    ip,
    port,
    user,
    pass,
  });

  window.location.reload();
}

const ServerSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
    const serverName = document.getElementsByTagName('input')[0].value;
    const ip = document.getElementsByTagName('input')[1].value;
    const port = document.getElementsByTagName('input')[2].value;
    const user = document.getElementsByTagName('input')[3].value;
    const pass = document.getElementsByTagName('input')[4].value;
    addServer(serverName, ip, port, user, pass);
    window.location.reload();
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Button className="addServer" type="primary" onClick={showModal}>
        Add Server
      </Button>
      <Modal
        title="Add Server"
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form>
          <Form.Item
            name="serverName"
            rules={[{ required: true }]}
            label="Server Name"
          >
            <Input />
          </Form.Item>
          <Form.Item name="IP Address" rules={[{ required: true }]} label="IP">
            <Input />
          </Form.Item>
          <Form.Item name="Port" rules={[{ required: true }]} label="Port">
            <Input />
          </Form.Item>
          <Form.Item
            name="UserName"
            rules={[{ required: true }]}
            label="Username"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Password"
            rules={[{ required: true }]}
            label="Password"
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

const CurrentHosts = () => {
  const navigate = useNavigate();
  const [hosts, setHosts] = useState({});
  const [editHost, setEditHost] = useState({});

  function handleInput(e: any, value: string) {
    const selectedButton = e.target.value;
    setEditHost(hosts[selectedButton]);
    if (e.detail === 2) {
      navigate(`/connect/${selectedButton}+${hosts[selectedButton].user}`);
    }

    if (e.detail === 1) {
      const removeButton = document.getElementsByClassName(selectedButton)[0];
      const editButton = document.getElementsByClassName(selectedButton)[1];
      editButton.style.display = 'block';
      removeButton.style.display = 'block';
      removeStyle(e, selectedButton);
    }
  }

  function removeStyle(e: any, value: string) {
    const selectedButton = e.target.value;
    const removeButton = document.getElementsByClassName(selectedButton)[0];
    const editButton = document.getElementsByClassName(selectedButton)[1];
    setTimeout(() => {
      removeButton.style.display = 'none';
      editButton.style.display = 'none';
    }, 3000);
  }

  useEffect(() => {
    ipcRenderer.send('getFromDB');
    ipcRenderer.on('getFromDB', (event, data) => {
      if (data === null) {
        console.log('No hosts');
      } else {
        setHosts(data);
      }
    });
  }, []);

  const [isModalOpenEdit, setIsModalOpenEdit] = useState(false);
  const handleOkEdit = () => {
    setIsModalOpenEdit(false);
    const serverName = document.getElementsByTagName('input')[0].value;
    const ip = document.getElementsByTagName('input')[1].value;
    const port = document.getElementsByTagName('input')[2].value;
    const user = document.getElementsByTagName('input')[3].value;
    const pass = document.getElementsByTagName('input')[4].value;
    addServer(serverName, ip, port, user, pass);
    window.location.reload();
  };

  const showModalEdit = () => {
    setIsModalOpenEdit(true);
  };

  const handleCancelEdit = () => {
    setIsModalOpenEdit(false);
  };

  const hostKeys = Object.keys(hosts);

  if (hostKeys.length === 0) {
    return (
      <div>
        <h2>Hosts</h2>
        <div className="hosts">
          <div className="host">
            <div className="host__icon">
              <CloudServerOutlined />
              <span>No Hosts</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <h2>Hosts</h2>
      <Modal
        title="Edit Server"
        open={isModalOpenEdit}
        onOk={handleOkEdit}
        onCancel={handleCancelEdit}
      >
        <Form>
          <Form.Item
            name="serverName"
            rules={[{ required: true }]}
            label="Server Name"
          >
            <Input disabled defaultValue={editHost.serverName} />
          </Form.Item>
          <Form.Item name="IP Address" rules={[{ required: true }]} label="IP">
            <Input defaultValue={editHost.ip} />
          </Form.Item>
          <Form.Item name="Port" rules={[{ required: true }]} label="Port">
            <Input defaultValue={editHost.port} />
          </Form.Item>
          <Form.Item
            name="UserName"
            rules={[{ required: true }]}
            label="Username"
          >
            <Input defaultValue={editHost.user} />
          </Form.Item>
          <Form.Item
            name="Password"
            rules={[{ required: true }]}
            label="Password"
          >
            <Input defaultValue={editHost.pass} />
          </Form.Item>
        </Form>
      </Modal>
      <div className="hosts">
        {hostKeys.map((host) => (
          <div key={host + 1} className="host">
            <button
              onClick={(e) => handleInput(e, host)}
              value={host}
              type="button"
              className="host__icon"
            >
              <CloudServerOutlined />
              {host}
            </button>
            <button
              className={`${host} removeButton`}
              type="button"
              value={host}
              onClick={() => deleteFromDB(host)}
            >
              <CloseOutlined />
            </button>
            <button
              className={`${host} editButton`}
              type="button"
              value={host}
              onClick={showModalEdit}
            >
              <EditOutlined />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const HomePage: React.FC = () => {
  return (
    <div className="homeContent">
      <Layout>
        <Header>
          <div>
            <ServerSettings />
          </div>
        </Header>
        <Content
          style={{
            margin: '24px 16px 0',
          }}
        >
          <CurrentHosts />
        </Content>
      </Layout>
      <CurrentHosts />
    </div>
  );
};

export default HomePage;
