import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Modal, Form, Select, Checkbox, Row, Col, Card, Dropdown, Upload } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, SettingOutlined, LockOutlined, UserOutlined, DownOutlined, ExportOutlined, ImportOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content, Header } = Layout;
const { Title } = Typography;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

// Giả lập danh sách tài khoản (Nên lưu Sheet riêng để quản lý lâu dài)
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

  // State Quản trị
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

  // LOGIC IMPORT THÔNG MINH
  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(sheet);

        // Ép mã CLB nếu là tài khoản User
        const finalData = rawData.map(row => ({
          ...row,
          maclb: user.role === 'USER' ? user.clb : row.maclb
        }));

        message.loading({ content: 'Đang tải lên...', key: 'up' });
        await axios.post(SHEETDB_URL, { data: finalData });
        message.success({ content: 'Thêm danh sách thành công!', key: 'up' });
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

  const mainActions = [
    { key: 'exp', label: 'Xuất Excel', icon: <ExportOutlined /> },
    { key: 'imp', label: (
      <Upload beforeUpload={handleImport} showUploadList={false}>
        <span style={{color:'red'}}>Import Excel (Thêm mới)</span>
      </Upload>
    ), icon: <ImportOutlined style={{color:'red'}} /> },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#f0f2f5', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Card style={{ width: 400, borderRadius: 12 }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" width={100} alt="logo" />
            <Title level={3}>VTF MANAGEMENT</Title>
          </div>
          <Form onFinish={handleLogin} layout="vertical">
            <Form.Item name="username"><Input prefix={<UserOutlined />} placeholder="Tên đăng nhập" size="large" /></Form.Item>
            <Form.Item name="password"><Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu" size="large" /></Form.Password></Form.Item>
            <Button type="primary" block size="large" htmlType="submit" style={{background:'#1d39c4'}}>ĐĂNG NHẬP</Button>
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
          <span style={{fontWeight:'bold'}}>{user.hoten} ({user.username})</span>
          {user.role === 'ADMIN' && (
            <Button icon={<SettingOutlined />} onClick={() => setIsAdminModalOpen(true)} type="primary" ghost>Quản trị</Button>
          )}
          <Button onClick={() => setIsLoggedIn(false)}>Đăng xuất</Button>
        </Space>
      </Header>

      <Content style={{ padding: '20px' }}>
        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <Title level={4}>Thông Tin Hội Viên</Title>
            <Space>
              <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm nhanh..." style={{ width: 250 }} onChange={e => setSearchText(e.target.value)} />
              <Dropdown menu={{ items: mainActions }}>
                <Button type="primary" icon={<DownOutlined />} style={{background:'#1d39c4'}}>Hành động</Button>
              </Dropdown>
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
              onChange: (p, ps) => setPagination({ current: p, pageSize: ps })
            }}
          />
        </div>
      </Content>

      {/* MODAL QUẢN TRỊ (HÌNH 1) */}
      <Modal title="Quản lý Tài khoản" open={isAdminModalOpen} onCancel={() => setIsAdminModalOpen(false)} width={1000} footer={null}>
        <Button type="primary" icon={<SettingOutlined />} style={{marginBottom:10}}>Thêm mới tài khoản</Button>
        <Table 
          size="small" dataSource={INITIAL_USERS} rowKey="username"
          columns={[
            { title: 'Tên đăng nhập', dataIndex: 'username', render: (t) => <a onClick={() => {setSelectedAccount(t); setIsUserDetailOpen(true)}}>{t}</a> },
            { title: 'Họ tên', dataIndex: 'hoten' },
            { title: 'Vai trò', dataIndex: 'role' },
            { title: 'Mã CLB', dataIndex: 'clb' },
            { title: 'Hành động', render: () => <Space><EditOutlined style={{color:'#1890ff'}} onClick={() => setIsUserDetailOpen(true)} /><DeleteOutlined style={{color:'red'}} /></Space> }
          ]}
        />
      </Modal>

      {/* MODAL CHI TIẾT TÀI KHOẢN (HÌNH 2) */}
      <Modal title="Tài khoản chi tiết thông tin" open={isUserDetailOpen} onCancel={() => setIsUserDetailOpen(false)} width={900} footer={[
        <Button key="save" type="primary" style={{background:'#1890ff'}}>Lưu thay đổi</Button>,
        <Button key="reset" style={{background:'#3f51b5', color:'#fff'}}>Đặt lại tên</Button>,
        <Button key="close" onClick={() => setIsUserDetailOpen(false)}>Đóng</Button>
      ]}>
        <Row gutter={24}>
          <Col span={12}>
            <Form layout="vertical">
              <Form.Item label="Tên đăng nhập"><Input defaultValue={selectedAccount || "CLB_00062"} /></Form.Item>
              <Form.Item label="Họ"><Input placeholder="Họ và tên người quản lý" /></Form.Item>
              <Form.Item label="Mật khẩu">
                <Input.Password placeholder="Nhập mật khẩu mới tại đây để thay đổi" prefix={<LockOutlined />} />
              </Form.Item>
              <Space style={{marginTop:10}}><Checkbox checked>Kích hoạt</Checkbox> <Checkbox>Đổi về lần đầu tiên</Checkbox></Space>
            </Form>
          </Col>
          <Col span={12} style={{ borderLeft: '1px solid #eee', paddingLeft: 20 }}>
            <Title level={5}>Phân quyền truy cập</Title>
            <Space direction="vertical">
              <Checkbox>Kế hoạch Đơn vị</Checkbox>
              <Checkbox checked>Câu lạc bộ (Lọc theo Mã CLB)</Checkbox>
              <Checkbox>Ở cấp độ chứng nhận</Checkbox>
              <Checkbox>Hệ thống quản trị (Quản trị viên)</Checkbox>
            </Space>
          </Col>
        </Row>
      </Modal>
    </Layout>
  );
};

export default App;
