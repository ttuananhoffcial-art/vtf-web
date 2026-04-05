import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Checkbox, Dropdown, Upload } from 'antd';
import { SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, DownOutlined, ExportOutlined, ImportOutlined, FileTextOutlined } from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState(''); // Lưu nội dung ô tìm kiếm
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
    } catch (error) { message.error("Lỗi kết nối dữ liệu!"); }
    finally { setLoading(false); }
  };

  // LOGIC TÌM KIẾM: Lọc dữ liệu dựa trên searchText
  const filteredData = dataSource.filter(item => {
    const search = searchText.toLowerCase();
    const hoten = (item.hoten || "").toLowerCase();
    const mahv = (item.mahv || "").toLowerCase();
    return hoten.includes(search) || mahv.includes(search);
  });

  // LOGIC XUẤT EXCEL
  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(dataSource);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoiVien");
    XLSX.writeFile(workbook, "Danh_Sach_Hoi_Vien_VTF.xlsx");
    message.success("Đang tải xuống file Excel...");
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 50, render: (t, r, i) => i + 1 },
    { title: 'Thao tác', key: 'action', width: 80, render: () => (
      <Space><EditOutlined style={{color:'red'}} /><DeleteOutlined style={{color:'red'}} /></Space>
    )},
    { title: 'Mã hội viên', dataIndex: 'mahv', key: 'mahv', width: 120, render: (text) => <b style={{color:'#1d39c4'}}>{text}</b> },
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

  // MENU CỦA NÚT HÀNH ĐỘNG
  const actionItems = [
    { key: 'export', label: 'Xuất Excel', icon: <ExportOutlined />, onClick: handleExport },
    { key: 'sample', label: 'Tải file mẫu', icon: <FileTextOutlined /> },
    { type: 'divider' },
    { key: 'import', label: 'Import Excel', icon: <ImportOutlined />, danger: true },
  ];

  if (!isLoggedIn) {
    return (
      <div style={{ background: '#fff', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '50px' }}>
        <img src="https://vtf.org.vn/wp-content/uploads/2021/06/logo-vtf.png" alt="logo" style={{ width: 220 }} />
        <h1 style={{ fontWeight: 'bold', fontSize: '26px', marginTop: '10px', color: '#000' }}>LIÊN ĐOÀN TAEKWONDO VIỆT NAM</h1>
        <div style={{ width: '350px', marginTop: '30px' }}>
          <Input placeholder="Tên đăng nhập *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '20px' }} onChange={e => setUsername(e.target.value)} />
          <Input.Password placeholder="Mật khẩu *" variant="borderless" style={{ borderBottom: '1px solid #ccc', marginBottom: '25px' }} onChange={e => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} />
          <div style={{ textAlign: 'center' }}>
            <Button type="primary" onClick={handleLogin} style={{ background: '#3f51b5', width: '150px', height: '40px' }}>Đăng nhập</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <div style={{ background: '#fff', padding: '10px 20px', borderBottom: '1px solid #d9d9d9' }}>
        <Space><Checkbox>Có hoạt động trong 1 năm</Checkbox><Checkbox>Không hoạt động trong 2 năm</Checkbox></Space>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Danh sách hội viên</Title>
          <Space>
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Tìm kiếm theo tên hoặc mã..." 
              style={{ width: 300 }} 
              value={searchText}
              onChange={e => setSearchText(e.target.value)} // Cập nhật text khi gõ
              allowClear
            />
            <Button type="primary" icon={<SearchOutlined />} style={{ background: '#1d39c4' }} onClick={fetchData}>Tìm kiếm</Button>
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1d39c4' }}>Thêm mới</Button>
            <Dropdown menu={{ items: actionItems }}>
              <Button type="primary" icon={<DownOutlined />} style={{ background: '#1d39c4' }}>Hành động</Button>
            </Dropdown>
          </Space>
        </div>
        <Table columns={columns} dataSource={filteredData} loading={loading} bordered size="small" scroll={{ x: 1600 }} rowKey={(r, i) => i} pagination={{ pageSize: 10 }} />
      </div>
    </div>
  );
};

export default App;
