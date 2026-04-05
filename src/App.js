import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Modal, Form, Checkbox, Row, Col, Dropdown, Upload } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, LockOutlined, DownOutlined, ExportOutlined, ImportOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content, Header } = Layout;
const { Title } = Typography;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const USERS = [
  { username: 'admin', password: '1', role: 'ADMIN', hoten: 'Quản trị viên', clb: 'ALL' },
  { username: 'CLB_00062', password: '1', role: 'USER', hoten: 'CLB Phú Lâm', clb: 'CLB_00062' }
];

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  const handleLogin = (v) => {
    const found = USERS.find(u => u.username === v.username && u.password === v.password);
    if (found) { setUser(found); setIsLoggedIn(true); fetchData(found); }
    else { message.error("Sai tài khoản hoặc mật khẩu!"); }
  };

  const fetchData = async (curr) => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      let data = Array.isArray(res.data) ? res.data : [];
      if (curr.role === 'USER') data = data.filter(i => i.maclb === curr.clb);
      setDataSource(data);
    } catch (e) { message.error("Lỗi tải dữ liệu!"); }
    finally { setLoading(false); }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'binary' });
        const raw = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const final = raw.map(r => ({ ...r, maclb: user.role === 'USER' ? user.clb : r.maclb }));
        await axios.post(SHEETDB_URL, { data: final });
        message.success("Thành công!");
        fetchData(user);
      } catch (err) { message.error("Lỗi file!"); }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 70, render: (t,r,i) => (pagination.current-1)*pagination.pageSize + i + 1 },
    { title: 'Thao Tác', key: 'action', width: 100, render: () => <Space><EditOutlined style={{color:'#1890ff'}} /><DeleteOutlined style={{color:'red'}} /></Space> },
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130 },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Đẳng Cấp', dataIndex: 'capdang', key: 'capdang', width: 100 },
  ];

  if (!isLoggedIn) return (
    <div style={{ background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
      <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" width={180} />
      <Title level={2} style={{marginTop: 20}}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</Title>
      <Form onFinish={handleLogin} style={{ width: 320, marginTop: 20 }}>
        <Form.Item name="username"><Input placeholder="Tài khoản" variant="borderless" style={{ borderBottom: '1px solid #ccc' }} /></Form.Item>
        <Form.Item name="password"><Input.Password placeholder="Mật khẩu" variant="borderless" style={{ borderBottom: '1px solid #ccc' }} /></Form.Item>
        <Button type="primary" block htmlType="submit" style={{ background: '#3f51b5', marginTop: 20 }}>Đăng nhập</Button>
      </Form>
    </div>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' }}>
        <Title level={4} style={{ color: '#1d39c4', margin: 0 }}>HỆ THỐNG VTF</Title>
        <Space>
          <b>{user.hoten}</b>
          {user.role === 'ADMIN' && <Button icon={<SettingOutlined />} onClick={() => setIsAdminModalOpen(true)}>Quản trị</Button>}
          <Button onClick={() => setIsLoggedIn(false)}>Thoát</Button>
        </Space>
      </Header>
      <Content style={{ padding: 20 }}>
        <div style={{ background: '#fff', padding: 20, borderRadius: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <Title level={5}>Thông Tin Hội Viên</Title>
            <Space>
              <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm..." onChange={e => setSearchText(e.target.value)} />
              <Dropdown menu={{ items: [
                { key: '1', label: 'Xuất Excel', icon: <ExportOutlined /> },
                { key: '2', label: <Upload beforeUpload={handleImport} showUploadList={false}><span style={{color:'red'}}>Import Excel</span></Upload>, icon: <ImportOutlined style={{color:'red'}} /> }
              ]}}>
                <Button type="primary" icon={<DownOutlined />} style={{background:'#1d39c4'}}>Hành động</Button>
              </Dropdown>
            </Space>
          </div>
          <Table 
            columns={columns} bordered size="small" scroll={{ x: 1200 }} rowKey="mahv"
            dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
            loading={loading}
            pagination={{ ...pagination, showTotal: (t, r) => `${r[0]}-${r[1]} của ${t} người`, onChange: (p, ps) => setPagination({ current: p, pageSize: ps }) }}
          />
        </div>
      </Content>
      <Modal title="Quản trị" open={isAdminModalOpen} onCancel={() => setIsAdminModalOpen(false)} footer={null}>
         <Table size="small" dataSource={USERS} columns={[
           { title: 'User', dataIndex: 'username', render: (t) => <a onClick={() => setIsUserDetailOpen(true)}>{t}</a> },
           { title: 'CLB', dataIndex: 'clb' },
           { title: 'Sửa', render: () => <EditOutlined onClick={() => setIsUserDetailOpen(true)} /> }
         ]} />
      </Modal>
      <Modal title="Chi tiết tài khoản" open={isUserDetailOpen} onCancel={() => setIsUserDetailOpen(false)} footer={[<Button type="primary" key="1" onClick={() => setIsUserDetailOpen(false)}>Lưu</Button>]}>
        <Form layout="vertical">
          <Form.Item label="Mật khẩu"><Input.Password prefix={<LockOutlined />} placeholder="Đổi mật khẩu" /></Form.Item>
          <Checkbox checked>Lọc dữ liệu theo CLB</Checkbox>
        </Form>
      </Modal>
    </Layout>
  );
};

export default App;
