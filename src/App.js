import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Typography, Layout, Dropdown, Upload, message, Input } from 'antd';
import { 
  DownOutlined, ExportOutlined, ImportOutlined, 
  FileTextOutlined, EditOutlined, DeleteOutlined, SearchOutlined 
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import axios from 'axios';
import 'antd/dist/reset.css';

const { Content } = Layout;
const { Title } = Typography;

// Link API SheetDB của bạn (Đã kết nối với Google Sheets)
const SHEETDB_URL = "https://sheetdb.io/api/v1/9vjgrwbz4hpbq";

const App = () => {
  const [dataSource, setDataSource] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Hàm tải dữ liệu từ Google Sheets
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(SHEETDB_URL);
      setDataSource(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      message.error("Lỗi tải dữ liệu từ hệ thống!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Hàm xử lý Import file Excel chuẩn như lúc chiều
  const handleImport = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const rawData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const cleanedData = rawData.map(row => {
          const newRow = {};
          Object.keys(row).forEach(key => {
            const cleanKey = key.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '');
            if (cleanKey.includes('mahoivien')) newRow['mahv'] = row[key];
            else if (cleanKey.includes('hoten')) newRow['hoten'] = row[key];
            else if (cleanKey.includes('ngaysinh')) {
                let val = row[key];
                newRow['ngaysinh'] = (val instanceof Date) ? val.toLocaleDateString('vi-VN') : val;
            }
            else if (cleanKey.includes('gioitinh')) newRow['gioitinh'] = row[key];
            else if (cleanKey.includes('madonvi')) newRow['madonvi'] = row[key];
            else if (cleanKey.includes('maclb')) newRow['maclb'] = row[key];
            else if (cleanKey.includes('tenclb')) newRow['tenclb'] = row[key];
            else if (cleanKey.includes('capdang')) newRow['capdang'] = row[key];
            else if (cleanKey.includes('magal')) newRow['magal'] = row[key];
          });
          return newRow;
        });

        if (cleanedData.length > 0) {
          message.loading({ content: 'Đang lưu vào Google Sheets...', key: 'up' });
          await axios.post(SHEETDB_URL, { data: cleanedData });
          message.success({ content: 'Import và Lưu thành công!', key: 'up' });
          fetchData();
        }
      } catch (error) {
        message.error({ content: 'Lỗi Import dữ liệu!', key: 'up' });
      }
    };
    reader.readAsBinaryString(file);
    return false; 
  };

  // Hàm tìm kiếm
  const filteredData = dataSource.filter(item => {
    const search = searchText.toLowerCase();
    const name = (item.hoten || "").toLowerCase();
    const code = (item.mahv || "").toLowerCase();
    return name.includes(search) || code.includes(search);
  });

  const columns = [
    { 
      title: 'STT', 
      key: 'stt', 
      width: 60, 
      fixed: 'left', 
      render: (text, record, index) => index + 1 
    },
    { 
      title: 'Thao Tác', 
      key: 'action', 
      width: 100, 
      fixed: 'left', 
      render: () => (
        <Space size="middle">
          <EditOutlined style={{color:'#1890ff', cursor: 'pointer'}} />
          <DeleteOutlined style={{color:'#ff4d4f', cursor: 'pointer'}} />
        </Space>
      ) 
    },
    { 
      title: 'Mã Hội viên', 
      dataIndex: 'mahv', 
      key: 'mahv', 
      width: 120, 
      render: (text) => <span style={{ color: '#1890ff', fontWeight: 'bold' }}>{text}</span> 
    },
    { title: 'Họ Và Tên', dataIndex: 'hoten', key: 'hoten', width: 200 },
    { title: 'Giới Tính', dataIndex: 'gioitinh', key: 'gioitinh', width: 100 },
    { title: 'Ngày Sinh', dataIndex: 'ngaysinh', key: 'ngaysinh', width: 120 },
    { title: 'Mã Đơn Vị', dataIndex: 'madonvi', key: 'madonvi', width: 120 },
    { title: 'Mã CLB', dataIndex: 'maclb', key: 'maclb', width: 120 },
    { title: 'Tên CLB', dataIndex: 'tenclb', key: 'tenclb', width: 220 },
    { title: 'Cấp Đẳng', dataIndex: 'capdang', key: 'capdang', width: 120 },
    { title: 'Mã GAL', dataIndex: 'magal', key: 'magal', width: 120 },
  ];

  const items = [
    { key: '1', label: 'Xuất Excel', icon: <ExportOutlined /> },
    { key: '2', label: 'Download file mẫu', icon: <FileTextOutlined /> },
    { type: 'divider' },
    { 
      key: '3', 
      label: (
        <Upload beforeUpload={handleImport} showUploadList={false}>
          <span style={{ color: 'red' }}>Import Excel (Thêm vào Sheets)</span>
        </Upload>
      ), 
      icon: <ImportOutlined style={{ color: 'red' }} /> 
    },
  ];

  return (
    <Layout style={{ padding: '20px', background: '#fff', minHeight: '100vh' }}>
      <Content>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Title level={3} style={{ color: '#1d39c4', margin: 0 }}>Hệ thống quản lý Hội viên VTF</Title>
          <Space size="middle">
            <Input 
              placeholder="Tìm theo Mã hội viên hoặc Họ tên..." 
              prefix={<SearchOutlined />} 
              style={{ width: 350, height: '40px' }}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
            <Dropdown menu={{ items }} placement="bottomRight">
              <Button type="primary" style={{ background: '#2f54eb', height: '40px' }}>
                Hành động <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          loading={loading}
          bordered 
          size="small"
          scroll={{ x: 1600 }}
          rowKey={(record, index) => index}
          pagination={{ 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '50', '100'],
            showTotal: (total) => `Tổng số: ${total} hội viên`
          }}
        />
      </Content>
    </Layout>
  );
};

export default App;