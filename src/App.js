import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Dropdown, Upload, message, Input, Card } from 'antd';
import { 
  DownOutlined, ExportOutlined, ImportOutlined, 
  FileTextOutlined, EditOutlined, DeleteOutlined, SearchOutlined, LockOutlined, UserOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;

const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // 1. XỬ LÝ ĐĂNG NHẬP
  const handleLogin = () => {
    // Bạn có thể đổi admin/123456 thành tài khoản bạn muốn
    if (username === 'admin' && password === '123456') {
      setIsLoggedIn(true);
      message.success("Đăng nhập thành công!");
      fetchData();
    } else {
      message.error("Sai tên đăng nhập hoặc mật khẩu!");
    }
  };

  // 2. XỬ LÝ DỮ LIỆU
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        // ... (giữ nguyên logic xử lý cleanedData như cũ)
        if (rawData.length > 0) {
          message.loading({ content: 'Đang lưu...', key: 'up' });
          await axios.post(SHEETDB_URL, { data: rawData });
          message.success({ content: 'Import thành công!', key: 'up' });
          fetchData();
        }
      } catch (error) { message.error("Lỗi Import!"); }
    };
    reader.readAsBinaryString(file);
    return false;
  };

  const filteredData = dataSource.filter(item => {
    const search = searchText.toLowerCase();
    return (item.hoten || "").toLowerCase().includes(search) || (item.mahv || "").toLowerCase().includes(search);
  });

  const columns = [
    { title: 'STT', key: 'stt', width: 60, fixed: 'left', render: (t, r, i) => i + 1 },
    { title: 'Thao tác', key: 'action', width: 100, fixed: 'left', render: () => (
      <Space><EditOutlined style={{color:'#1890ff'}} /><DeleteOutlined style={{color:'#ff4d4f'}} /></Space>
    )},
    { title: 'Mã hội viên', dataIndex: 'mahv', key: 'mahv', width: 120, render: (text) => <b style={{color:'#1890ff'}}>{text}</b> },
    { title: 'Họ và tên', dataIndex: 'hoten', key: 'hoten', width: 200 },
    { title: 'Giới tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 100 },
    { title: 'Ngày sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 120 },
    { title: 'Mã đơn vị', dataIndex: 'madonvi', key: 'madonvi', width: 150 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 120 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Cấp đẳng', dataIndex: 'capdang', key: 'capdang', width: 120 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 120 },
  ];

  // GIAO DIỆN 1: ĐĂNG NHẬP
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#f5f5f5', flexDirection: 'column' }}>
        <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" alt="logo" style={{ width: 150, marginBottom: 20 }} />
        <Card title={<Title level={4} style={{ textAlign: 'center', margin: 0 }}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</Title>} style={{ width: 400, textAlign: 'center' }}>
          <p>Đăng nhập</p>
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Tên đăng nhập" 
            style={{ marginBottom: 15 }} 
            onChange={e => setUsername(e.target.value)}
          />
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Mật khẩu" 
            style={{ marginBottom: 20 }} 
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleLogin}
          />
          <Button type="primary" block onClick={handleLogin} style={{ background: '#2f54eb' }}>Đăng nhập</Button>
          <Button type="link" style={{ marginTop: 10 }}>Quên mật khẩu?</Button>
        </Card>
      </div>
    );
  }

  // GIAO DIỆN 2: QUẢN LÝ DỮ LIỆU
  return (
    <Layout style={{ padding: '20px', background: '#fff', minHeight: '100vh' }}>
      <Content>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Title level={3} style={{ color: '#1d39c4' }}>Danh sách hội viên</Title>
          <Space>
            <Input 
              placeholder="Tìm kiếm..." 
              prefix={<SearchOutlined />} 
              style={{ width: 300 }} 
              onChange={e => setSearchText(e.target.value)}
            />
            <Dropdown menu={{ items: [
              { key: '1', label: 'Xuất Excel', icon: <ExportOutlined /> },
              { key: '3', label: <Upload beforeUpload={handleImport} showUploadList={false}>Import Excel</Upload>, icon: <ImportOutlined /> }
            ]}}>
              <Button type="primary" icon={<DownOutlined />}>Hành động</Button>
            </Dropdown>
            <Button onClick={() => setIsLoggedIn(false)}>Đăng xuất</Button>
          </Space>
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading} 
          bordered 
          scroll={{ x: 1500 }} 
          rowKey={(r, i) => i}
          pagination={{ pageSize: 10 }}
        />
      </Content>
    </Layout>
  );
};

export default App;