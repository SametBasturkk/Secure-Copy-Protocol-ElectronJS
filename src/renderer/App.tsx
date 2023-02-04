import React from 'react';
import { ipcMain } from 'electron';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  useNavigate,
} from 'react-router-dom';
import {
  UploadOutlined,
  UserOutlined,
  VideoCameraOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { Button, Layout, Menu, theme } from 'antd';
import icon from '../../assets/icon.svg';
import 'antd/dist/reset.css';
import './App.css';
import HomePage from './Pages/home';
import ConnectServer from './Pages/connectServer';

const { Header, Content, Footer, Sider } = Layout;

const Hello = () => {
  const navigate = useNavigate();

  return (
    <div className="sideBar">
      <Layout>
        <Sider
          breakpoint="lg"
          collapsedWidth="0"
          onBreakpoint={(broken) => {
            console.log(broken);
          }}
          onCollapse={(collapsed, type) => {
            console.log(collapsed, type);
          }}
        >
          <div className="logo" />
          <Menu
            theme="dark"
            mode="inline"
            defaultSelectedKeys={['1']}
            items={[
              {
                key: '1',
                icon: <UserOutlined />,
                label: 'Home',
                onClick: () => navigate('/'),
              },
              {
                key: '2',
                icon: <CloudServerOutlined />,
                label: 'Server',
                onClick: () => navigate(`/connect/`),
                className: 'serverTab',
              },
            ]}
          />
        </Sider>
      </Layout>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Hello />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/connect/:id" element={<ConnectServer />} />
      </Routes>
    </Router>
  );
}
