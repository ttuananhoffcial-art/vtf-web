import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Dropdown, Upload, message, Input, Card, Checkbox } from 'antd';
import { 
  DownOutlined, ExportOutlined, ImportOutlined, 
  SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined
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

  const handleLogin = () => {
    if (username === 'admin' && password === '123456') {
      setIsLoggedIn(true);
      fetchData();
    } else {
      message.error("Sai tài khoản hoặc mật khẩu!");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      message.error("Không thể kết nối dữ liệu!");
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 50, render: (t, r, i) => i + 1 },
    { title: 'Thao tác', key: 'action', width: 80, render: () => (
      <Space><EditOutlined style={{color:'red'}} /><DeleteOutlined style={{color:'red'}} /></Space>
    )},
    { title: 'Mã hội viên', dataIndex: 'mahv', key: 'mahv', width: 120, render: (text) => <span style={{color:'#1d39c4', cursor:'pointer'}}>{text}</span> },
    { title: 'Họ và tên', dataIndex: 'hoten', key: 'hoten', width: 180 },
    { title: 'Giới tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 90 },
    { title: 'Ngày sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 110 },
    { title: 'Mã đơn vị', dataIndex: 'madonvi', key: 'madonvi', width: 250 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 100 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 200 },
    { title: 'Cấp đẳng', dataIndex: 'capdang', key: 'capdang', width: 100 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 100 },
    { title: 'Mã GSGK', dataIndex: 'magsgk', key: 'magsgk', width: 100 },
  ];

  // GIAO DIỆN 1: ĐĂNG NHẬP (GIỐNG HÌNH 1)
  if (!isLoggedIn) {
    return (
      <div style={{ background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
        <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" alt="logo" style={{ width: 250 }} />
        <h1 style={{ fontWeight: 'bold', fontSize: '32px', marginTop: '10px' }}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</h1>
        <div style={{ width: '400px', marginTop: '20px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '20px' }}>Đăng nhập</h2>
          <Input placeholder="Tên đăng nhập *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} onChange={e => setUsername(e.target.value)} />
          <Input.Password placeholder="Mật khẩu *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} onChange={e => setPassword(e.target.value)} />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={handleLogin} style={{ background: '#3f51b5', borderRadius: '4px', padding: '0 40px' }}>Đăng nhập</Button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '15px' }}>
            <Button type="link" style={{ color: '#3f51b5' }}>Quên mật khẩu?</Button>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN 2: DANH SÁCH (GIỐNG HÌNH 2)
  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #d9d9d9' }}>
        <Space>
          <Checkbox>Có hoạt động trong 1 năm</Checkbox>
          <Checkbox>Không hoạt động trong 2 năm</Checkbox>
        </Space>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Danh sách hội viên</Title>
          <Space>
            <Input prefix={<SearchOutlined />} placeholder="Tìm kiếm" style={{ width: 250 }} />
            <Button type="primary" icon={<SearchOutlined />} style={{ background: '#1d39c4' }}>Tìm kiếm</Button>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1d39c4' }}>Thêm mới</Button>
            <Button type="primary" icon={<DownOutlined />} style={{ background: '#1d39c4' }}>Hành động</Button>
          </Space>
        </div>
        <Table 
          columns={columns} 
          dataSource={dataSource} 
          loading={loading}
          bordered 
          size="small" 
          scroll={{ x: 1600 }}
          rowClassName={(record, index) => index % 2 === 0 ? '' : 'ant-table-row-light'}
          pagination={{ 
            total: 383603, 
            showSizeChanger: true, 
            pageSize: 10,
            showTotal: (total, range) => `${range[0]} - ${range[1]} of ${total}` 
          }}
        />
      </div>
    </div>
  );
};

export default App;