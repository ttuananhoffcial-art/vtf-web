import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Modal, Form, Select, Checkbox, Row, Col, Card } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, LockOutlined, UserOutlined, DownOutlined, ReloadOutlined } from '@ant-design/icons';
import axios from 'axios';
import 'antd/dist/reset.css';

const { Content, Header } = Layout;
const { Title } = Typography;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

// Danh sách tài khoản mẫu (Sau này bạn có thể lưu vào 1 Sheet riêng)
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
  
  // State Phân trang
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  // State Modal
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isUserEditOpen, setIsUserEditOpen] = useState(false);

  const handleLogin = (values) => {
    const found = USERS.find(u => u.username === values.username && u.password === values.password);
    if (found) {
      setUser(found);
      setIsLoggedIn(true);
      fetchData(found);
    } else {
      message.error("Sai tài khoản hoặc mật khẩu!");
    }
  };

  const fetchData = async (currentUser) => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      let data = Array.isArray(res.data) ? res.data : [];
      // LOGIC PHÂN QUYỀN: User chỉ thấy dữ liệu CLB của mình
      if (currentUser.role === 'USER') {
        data = data.filter(item => item.maclb === currentUser.clb);
      }
      setDataSource(data);
    } catch (e) { message.error("Lỗi tải dữ liệu!"); }
    finally { setLoading(false); }
  };

  const columns = [
    { 
      title: 'STT', 
      key: 'stt', 
      width: 70, 
      fixed: 'left',
      render: (t, r, index) => (pagination.current - 1) * pagination.pageSize + index + 1 
    },
    { title: 'Thao Tác', key: 'action', width: 100, fixed: 'left', render: () => (
      <Space>
        <EditOutlined style={{color:'#1890ff', cursor:'pointer'}} />
        <DeleteOutlined style={{color:'#ff4d4f', cursor:'pointer'}} />
      </Space>
    )},
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130, render: (t) => <b style={{color:'#1d39c4'}}>{t}</b> },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Đẳng Cấp', dataIndex: 'capdang', key: 'capdang', width: 100 },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#f0f2f5', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" width={120} />
            <Title level={3} style={{ marginTop: 10 }}>VTF LOGIN</Title>
          </div>
          <Form onFinish={handleLogin} layout="vertical">
            <Form.Item name="username" rules={[{required: true}]}><Input prefix={<UserOutlined />} placeholder="Tài khoản" size="large" /></Form.Item>
            <Form.Item name="password" rules={[{required: true}]}><Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" /></Form.Item>
            <Button type="primary" block size="large" htmlType="submit" style={{ background: '#1d39c4' }}>ĐĂNG NHẬP</Button>
          </Form>
        </Card>
      </div>
    );
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid #eee' }}>
        <Title level={4} style={{ margin: 0, color: '#1d39c4' }}>HỆ THỐNG QUẢN LÝ VTF</Title>
        <Space>
          <span style={{ fontWeight: 'bold' }}>{user.hoten}</span>
          {user.role === 'ADMIN' && (
            <Button icon={<SettingOutlined />} onClick={() => setIsAdminModalOpen(true)} type="primary" ghost>Quản trị</Button>
          )}
          <Button onClick={() => setIsLoggedIn(false)}>Đăng xuất</Button>
        </Space>
      </Header>

      <Content style={{ padding: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <Title level={4}>Thông Tin Hội Viên {user.role === 'USER' && `(CLB: ${user.clb})`}</Title>
            <Space>
              <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm nhanh..." style={{ width: 250 }} onChange={e => setSearchText(e.target.value)} />
              <Button icon={<ReloadOutlined />} onClick={() => fetchData(user)} />
            </Space>
          </div>
          
          <Table 
            columns={columns} 
            dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
            loading={loading} bordered size="small" scroll={{ x: 1200 }} rowKey="mahv"
            pagination={{ 
              ...pagination,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} người`,
              onChange: (page, pageSize) => setPagination({ current: page, pageSize })
            }}
          />
        </div>
      </Content>

      {/* MODAL QUẢN TRỊ (HÌNH 1) */}
      <Modal title="Danh sách Tài khoản Quản trị" open={isAdminModalOpen} onCancel={() => setIsAdminModalOpen(false)} width={900} footer={null}>
        <Table 
          size="small" dataSource={USERS} rowKey="username"
          columns={[
            { title: 'Tên đăng nhập', dataIndex: 'username', render: (t) => <a onClick={() => setIsUserEditOpen(true)}>{t}</a> },
            { title: 'Họ tên', dataIndex: 'hoten' },
            { title: 'Vai trò', dataIndex: 'role' },
            { title: 'Mã CLB', dataIndex: 'clb' },
            { title: 'Hành động', render: () => <EditOutlined onClick={() => setIsUserEditOpen(true)} style={{color:'#1890ff'}} /> }
          ]}
        />
      </Modal>

      {/* MODAL CHI TIẾT TÀI KHOẢN (HÌNH 2) */}
      <Modal title="Thông tin chi tiết tài khoản" open={isUserEditOpen} onCancel={() => setIsUserEditOpen(false)} width={800} footer={[
        <Button key="s" type="primary">Lưu thay đổi</Button>,
        <Button key="r" style={{background:'#3f51b5', color:'#fff'}}>Reset mật khẩu</Button>,
        <Button key="c" onClick={() => setIsUserEditOpen(false)}>Đóng</Button>
      ]}>
        <Row gutter={24}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Tên đăng nhập"><Input defaultValue="CLB_00062" /></Form.Item>
              <Form.Item label="Họ tên"><Input defaultValue="CLB Taekwondo Phú Lâm" /></Form.Item>
              <Form.Item label="Mật khẩu"><Input.Password placeholder="Nhập để đổi mới" /></Form.Item>
              <Space><Checkbox checked>Kích hoạt</Checkbox> <Checkbox>Đổi Pass lần đầu</Checkbox></Space>
            </Form>
          </Col>
          <Col span={12} style={{ borderLeft: '1px solid #eee', paddingLeft: 20 }}>
            <Title level={5}>Phân quyền truy cập</Title>
            <Space direction="vertical">
              <Checkbox>Quản lý Đơn vị</Checkbox>
              <Checkbox checked>Câu lạc bộ (Lọc theo Mã CLB)</Checkbox>
              <Checkbox>In chứng nhận cấp đẳng</Checkbox>
              <Checkbox>Quản trị hệ thống (Admin)</Checkbox>
            </Space>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
};

export default App;
