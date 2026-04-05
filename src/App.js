import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Modal, Form, Select, Checkbox, Row, Col, Card, Dropdown, Upload } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, LockOutlined, UserOutlined, DownOutlined, ExportOutlined, ImportOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content, Header } = Layout;
const { Title } = Typography;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const INITIAL_USERS = [
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
  const [selectedAccount, setSelectedAccount] = useState(null);

  const handleLogin = (values) => {
    const found = INITIAL_USERS.find(u => u.username === values.username && u.password === values.password);
    if (found) {
      setUser(found);
      setIsLoggedIn(true);
      fetchData(found);
    } else { message.error("Sai tài khoản hoặc mật khẩu!"); }
  };

  const fetchData = async (currentUser) => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      let data = Array.isArray(res.data) ? res.data : [];
      if (currentUser.role === 'USER') {
        data = data.filter(item => item.maclb === currentUser.clb);
      }
      setDataSource(data);
    } catch (e) { message.error("Lỗi tải dữ liệu!"); }
    finally { setLoading(false); }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const finalData = rawData.map(row => ({
          ...row,
          maclb: user.role === 'USER' ? user.clb : row.maclb
        }));
        message.loading({ content: 'Đang tải lên...', key: 'up' });
        await axios.post(SHEETDB_URL, { data: finalData });
        message.success({ content: 'Import thành công!', key: 'up' });
        fetchData(user);
      } catch (err) { message.error("Lỗi file Excel!"); }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 70, fixed: 'left', render: (t,r,i) => (pagination.current-1)*pagination.pageSize + i + 1 },
    { title: 'Thao Tác', key: 'action', width: 100, fixed: 'left', render: () => (
      <Space><EditOutlined style={{color:'#1890ff'}} /><DeleteOutlined style={{color:'red'}} /></Space>
    )},
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130, render: (t) => <b style={{color:'#1d39c4'}}>{t}</b> },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Đẳng Cấp', dataIndex: 'capdang', key: 'capdang', width: 100 },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
        <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" width={200} alt="logo" />
        <h1 style={{ fontWeight: 'bold', fontSize: '24px', marginTop: '10px' }}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</h1>
        <div style={{ width: '350px', marginTop: '30px' }}>
          <Form onFinish={handleLogin}>
            <Form.Item name="username"><Input placeholder="Tên đăng nhập *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '10px' }} /></Form.Item>
            <Form.Item name="password"><Input.Password placeholder="Mật khẩu *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} /></Form.Item>
            <Button type="primary" block htmlType="submit" style={{ background: '#3f51b5', height: '40px' }}>Đăng nhập</Button>
          </Form>
        </div>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #eee' }}>
        <Title level={4} style={{ margin: 0, color: '#1d39c4' }}>HỆ THỐNG QUẢN LÝ VTF</Title>
        <Space>
          <span style={{fontWeight:'bold'}}>{user.hoten}</span>
          {user.role === 'ADMIN' && <Button icon={<SettingOutlined />} onClick={() => setIsAdminModalOpen(true)} type="primary" ghost>Quản trị</Button>}
          <Button onClick={() => setIsLoggedIn(false)}>Đăng xuất</Button>
        </Space>
      </Header>
      <Content style={{ padding: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <Title level={4}>Thông Tin Hội Viên</Title>
            <Space>
              <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm nhanh..." style={{ width: 250 }} onChange={e => setSearchText(e.target.value)} allowClear />
              <Dropdown menu={{ items: [
                { key: 'exp', label: 'Xuất Excel', icon: <ExportOutlined /> },
                { key: 'imp', label: <Upload beforeUpload={handleImport} showUploadList={false}><span style={{color:'red'}}>Import Excel (Thêm mới)</span></Upload>, icon: <ImportOutlined style={{color:'red'}} /> }
              ]}}>
                <Button type="primary" icon={<DownOutlined />} style={{background:'#1d39c4'}}>Hành động</Button>
              </Dropdown>
            </Space>
          </div>
          <Table 
            columns={columns} 
            dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
            loading={loading} bordered size="small" scroll={{ x: 1200 }} rowKey="mahv"
            pagination={{ ...pagination, showTotal: (t, r) => `${r[0]}-${r[1]} của ${t} người`, onChange: (p, ps) => setPagination({ current: p, pageSize: ps }) }}
          />
        </div>
      </Content>

      <Modal title="Quản lý Tài khoản" open={isAdminModalOpen} onCancel={() => setIsAdminModalOpen(false)} width={900} footer={null}>
        <Table size="small" dataSource={INITIAL_USERS} columns={[
          { title: 'Tài khoản', dataIndex: 'username', render: (t) => <a onClick={() => {setSelectedAccount(t); setIsUserDetailOpen(true)}}>{t}</a> },
          { title: 'Họ tên', dataIndex: 'hoten' },
          { title: 'Mã CLB', dataIndex: 'clb' },
          { title: 'Hành động', render: () => <Space><EditOutlined onClick={() => setIsUserDetailOpen(true)} style={{color:'#1890ff'}} /><DeleteOutlined style={{color:'red'}} /></Space> }
        ]} />
      </Modal>

      <Modal title="Tài khoản chi tiết thông tin" open={isUserDetailOpen} onCancel={() => setIsUserDetailOpen(false)} width={800} footer={[<Button key="1" type="primary">Lưu</Button>,<Button key="2" onClick={() => setIsUserDetailOpen(false)}>Đóng</Button>]}>
        <Row gutter={24}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Tên đăng nhập"><Input defaultValue={selectedAccount} /></Form.Item>
              <Form.Item label="Họ tên"><Input placeholder="Họ và tên" /></Form.Item>
              <Form.Item label="Mật khẩu"><Input.Password placeholder="Nhập mật khẩu mới tại đây" prefix={<LockOutlined />} /></Form.Item>
              <Space><Checkbox checked>Kích hoạt</Checkbox></Space>
            </Form>
          </Col>
          <Col span={12}>
            <Title level={5}>Phân quyền</Title>
            <Checkbox checked>Câu lạc bộ (Lọc theo Mã CLB)</Checkbox>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
};

export default App;
