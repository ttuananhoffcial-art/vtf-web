import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Input, message, Checkbox, Dropdown, Modal } from 'antd';
import { 
  SearchOutlined, EditOutlined, DeleteOutlined, PlusOutlined, 
  DownOutlined, ExportOutlined, ImportOutlined, FileTextOutlined, ExclamationCircleOutlined 
} from '@ant-design/icons';
import axios from 'axios';
import * as XLSX from 'xlsx';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;
const { confirm } = Modal;
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // Lưu các dòng được tích chọn

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

  // LOGIC XUẤT EXCEL (Chỉ xuất những người được chọn)
  const handleExportSelected = () => {
    if (selectedRowKeys.length === 0) {
      message.warning("Vui lòng tích chọn ít nhất một người để xuất Excel!");
      return;
    }
    const dataToExport = dataSource.filter((item, index) => selectedRowKeys.includes(index));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "HoiVienDuocChon");
    XLSX.writeFile(workbook, "Danh_Sach_Chon_Loc.xlsx");
    message.success(`Đã xuất Excel ${selectedRowKeys.length} hội viên!`);
  };

  // LOGIC XÁC NHẬN XÓA
  const showDeleteConfirm = (index) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa hội viên này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Hành động này không thể hoàn tác.',
      okText: 'Đồng ý xóa',
      okType: 'danger',
      cancelText: 'Hủy bỏ',
      onOk() {
        message.loading("Đang xóa...");
        // Ở đây sẽ gọi API xóa của SheetDB nếu cần
        const newData = [...dataSource];
        newData.splice(index, 1);
        setDataSource(newData);
        message.success("Đã xóa thành công!");
      },
    });
  };

  const columns = [
    { title: 'STT', key: 'stt', width: 60, fixed: 'left', render: (t, r, i) => i + 1 },
    { 
      title: 'Thao Tác', 
      key: 'action', 
      width: 100, 
      fixed: 'left', 
      render: (text, record, index) => (
        <Space size="middle">
          <EditOutlined style={{color:'#1890ff', cursor: 'pointer'}} onClick={() => message.info("Chức năng sửa đang được cập nhật!")} />
          <DeleteOutlined style={{color:'#ff4d4f', cursor: 'pointer'}} onClick={() => showDeleteConfirm(index)} />
        </Space>
      ) 
    },
    { title: 'Mã Hội Viên', dataIndex: 'mahv', key: 'mahv', width: 130, render: (text) => <b style={{color:'#1d39c4'}}>{text}</b> },
    { title: 'Họ và Tên', dataIndex: 'hoten', key: 'hoten', width: 200 },
    { title: 'Giới Tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 100 },
    { title: 'Ngày Sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 120 },
    { title: 'Mã Đơn Vị', dataIndex: 'madonvi', key: 'madonvi', width: 200 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 110 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 220 },
    { title: 'Cấp Đẳng', dataIndex: 'capdang', key: 'capdang', width: 110 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 110 },
    { title: 'Mã GSGK', dataIndex: 'magsgk', key: 'magsgk', width: 110 },
  ];

  // Cấu hình tích chọn dòng (Checkbox)
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  };

  const actionItems = [
    { key: 'export', label: 'Xuất Excel người đã chọn', icon: <ExportOutlined />, onClick: handleExportSelected },
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
              placeholder="Tìm theo Mã hoặc Họ tên..." 
              style={{ width: 280 }} 
              onChange={e => setSearchText(e.target.value)}
              allowClear
            />
            <Button type="primary" icon={<PlusOutlined />} style={{ background: '#1d39c4' }}>Thêm mới</Button>
            <Dropdown menu={{ items: actionItems }}>
              <Button type="primary" icon={<DownOutlined />} style={{ background: '#1d39c4' }}>Hành động</Button>
            </Dropdown>
          </Space>
        </div>
        <Table 
          rowSelection={rowSelection}
          columns={columns} 
          dataSource={dataSource.filter(i => (i.hoten||"").toLowerCase().includes(searchText.toLowerCase()) || (i.mahv||"").toLowerCase().includes(searchText.toLowerCase()))} 
          loading={loading} 
          bordered 
          size="small" 
          scroll={{ x: 1700 }} 
          rowKey={(r, i) => i} 
          pagination={{ pageSize: 10, showTotal: (t) => `Tổng: ${t} hội viên` }} 
        />
      </div>
    </div>
  );
};

export default App;
